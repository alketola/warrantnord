// ==UserScript==
// @name         WarrantNord
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Samples quotes on the page and draws graphs on an overlay DIV
// @author       Antti Ketola
// @match        https://www.nordnet.fi/markkinakatsaus/unlimited-turbot/*
// @match        https://www.nordnet.fi/markkinakatsaus/minifutuurit/*
// @match        https://www.nordnet.fi/markkinakatsaus/sertifikaatit/*
// donotmatch        https://www.nordnet.fi/markkinakatsaus/osakekurssit/* // Tällä sivulla on hieman eri rakenne, ei toimi
// @grant        none
// @require http://code.jquery.com/jquery-latest.js
// ==/UserScript==
let quoteDiv; // The upper DIV element where to find the quotes
let quoteBuyElem;
let quoteBuyVol;
let quoteSellElem;
let quoteSellVol;
let quotesBuy = [];
let lastValidPriceBuy = 0.0;
let lastValidVolBuy = 1000;
let lastValidVolSell = 1000;
let quotesSell = [];
let lastValidPriceSell = 0.0;
let quotesEMA1 = [];
let emaLen1 = 50;
let quotesEMA2 = [];
let emaLen2 = 100;
let quotesEMA3 = [];
let emaLen3 = 200;
let qEMA1;
let lastEMA1;
var emaObj_1;
var emaObj_2;
const quotesMaxLen = 400;
const intervalMs = 1000;
let intervalCount=0;
let gfxs;
const canvasMargin = 10;
const canvasW = quotesMaxLen * 2 + 2 * canvasMargin;
const canvasH = 150;
var targetDiv; // The DIV to be created to display our things
var dragHeader; // The header in the targetDIV to make it possible to drag it around the window
var positionX = "50px";
var positionY = "50%";

// EMA calculator and storage class
class Ema {
    constructor(length) {
        this.numSamples=length;
        this.data = [];
    }
    // EMA[0] = EMA[-1] + alpha(price[0] - EMA[-1];

    calcNewEMA(lastExpAvg,priceNow, pNumSamples, prevEMA) {
        this.numSamples = pNumSamples;
        if(this.numSamples<1) return 0;
        let alpha = 2 / (this.numSamples + 1);
        let nE = lastExpAvg + alpha * (priceNow - prevEMA);
        this.data.push(nE);
        if(this.data.length>quotesMaxLen) this.data.shift();
        return nE;
    }

}

(function() {
    'use strict';
    let $ = window.jQuery;
    // Your code here...
    $(document).delay(1000); // Wait a sec to load the page, works more reliably so.
    //let targetDiv= document.querySelector("#main-content > div > div ");//.css("background", "lightblue");
    targetDiv=document.querySelector('body').appendChild(document.createElement('div'));
    //targetDiv.setAttribute("style", "position:fixed;x:"+positionX+";y:"+positionY);
    targetDiv.id = "warranttokill";
    targetDiv.style.opacity = 0.8;
    targetDiv.style.border="thin double black";
    targetDiv.style.zIndex="30";
    targetDiv.style.height = canvasH + 10 * canvasMargin + "px";

    targetDiv.style.position = "absolute";
    targetDiv.style.left = positionX;
    targetDiv.style.top = positionY;

    dragHeader = targetDiv.appendChild(document.createElement('div'));
    dragHeader.id = "warrantnordheader";
    dragHeader.innerText = "WarrantNord: drag - raahaa - arrastra";

    dragHeader.style.background = "blue";
    dragHeader.style.padding="10px";
    dragHeader.style.cursor="move";
    dragHeader.style.backgroundcolor="#2196F3";
    dragHeader.style.color="#fff";
    dragHeader.style.left = positionX;
    dragHeader.style.top = positionY;

    quoteDiv = targetDiv.appendChild(document.createElement('div'));
    quoteDiv.setAttribute("id","quoteDivine");
    quoteDiv.innerHTML = "<p> -Place for quotes- </p>";
    let warrantQuoteBuyElem = $("td:nth-child(3)");//.css("background", "lightblue") // to check where it's pointing you may color the background
    let warrantQuoteBuyVol= $("td:nth-child(1)");//.css("background", "orange");
    let warrantQuoteSellElem = $("td:nth-child(5)"); //.css("background", "orange")
    let warrantQuoteSellVol= $("td:nth-child(7)");//.css("background", "lightblue");

//    let shareQuoteBuyElem = $("div:nth-child(18)").css("background", "lightblue");
//    let shareQuoteBuyVol= $("div:nth-child(3)").css("background", "orange");
//    let shareQuoteSellElem = $("div:nth-child(4)").css("background", "pink")
//    let shareQuoteSellVol= $("div:nth-child(9)").css("background", "lightbrown");

//    quoteBuyElem = shareQuoteBuyElem;
//    quoteBuyVol= shareQuoteBuyVol;
//    quoteSellElem = shareQuoteSellVol;
//    quoteSellVol = shareQuoteSellVol;

    quoteBuyElem = warrantQuoteBuyElem;
    quoteBuyVol= warrantQuoteBuyVol;
    quoteSellElem = warrantQuoteSellElem;
    quoteSellVol = warrantQuoteSellVol;

    let cdiv = targetDiv.appendChild(document.createElement('div'));
    cdiv.style.height="match_content";
    //cdiv.innerHTML = "<b>Canvas to here</b>";
    let cnvs = document.createElement('canvas');
    cnvs.setAttribute('id','stock_graph');
    cnvs.setAttribute('width',canvasW.toString());
    cnvs.setAttribute('heigth',canvasH.toString());

    cdiv.appendChild(cnvs);
    gfxs = cnvs.getContext("2d");
    initQuotes()
    dragElement(document.getElementById("warranttokill"));

    setInterval(updateQuotes, intervalMs); // THIS IS THE MAIN LOOP.
})();

function initQuotes() {
    emaObj_1 = new Ema(9);
    lastEMA1 = 0.0;

    // This is where you rip the data from the page
    lastValidPriceBuy = parseFloat(quoteBuyElem.text().split(" ")[1].toString());
    lastValidPriceSell = parseFloat(quoteSellElem.text().split(" ")[1].toString());
    lastValidVolBuy = parseFloat(quoteBuyVol.text().split(" ")[1].toString());
    lastValidVolSell = parseFloat(quoteSellVol.text().split(" ")[1].toString());
}


function updateQuotes() {
    // This is where you rip the data from the page
    let priceBuy = parseFloat(quoteBuyElem.text().split(" ")[1].toString());
    let priceSell = parseFloat(quoteSellElem.text().split(" ")[1].toString());
    let volBuy = parseFloat(quoteBuyVol.text().split(" ")[1].toString());
    let volSell = parseFloat(quoteSellVol.text().split(" ")[1].toString());

    if(lastEMA1 < 0.01) {
        lastEMA1 = priceSell;
    } else {
        lastEMA1 = qEMA1;
    }
    qEMA1 = newEMA(lastEMA1, priceSell, emaLen1,lastEMA1);
    let newBuyEntry = priceBuy
    if(volBuy>=lastValidVolBuy) {
        newBuyEntry = priceBuy;
        lastValidPriceBuy = priceBuy
    } else {
        quotesBuy.push(lastValidPriceBuy);
    }
    quotesBuy.push(newBuyEntry);
    if(quotesBuy.length>quotesMaxLen) quotesBuy.shift();

    let newSellEntry = priceSell
    if(volSell>=lastValidVolSell) {
          lastValidPriceSell = priceSell;
    } else {
        quotesSell.push(lastValidPriceSell);
    }
    quotesSell.push(newSellEntry);
    if(quotesSell.length>quotesMaxLen) quotesSell.shift();

    quotesEMA1.push(qEMA1);
    if(quotesEMA1.length>quotesMaxLen) quotesEMA1.shift();


    quoteDiv.innerHTML = "<p> Quotes: BUY:" + priceBuy.toString() + " Vol: " + volBuy + " SELL: "+ priceSell + " Vol: " + volSell + " EMA: " + qEMA1.toPrecision(4) + " secs: " + intervalCount + " </p>";
    intervalCount++;
    drawGraphs();
}
// EMA[0] = EMA[-1] + alpha(price[0] - EMA[-1];

function newEMA(lastExpAvg, priceNow, numSamples, prevEMA) {
    let alpha = 2 / (numSamples + 1);
    let nE = lastExpAvg + alpha * (priceNow - prevEMA);
    return nE;
}




function drawGraphs() {
    // clear canvas
    gfxs.fillStyle = "#F0F0F8";
    gfxs.fillRect(0, 0, canvasW, canvasH);

    let hi = Math.max.apply(Math,quotesSell);
    let lo = Math.min.apply(Math,quotesBuy);
    if(hi == lo) { hi+= 1;};

    quoteGraph(quotesBuy,gfxs,"blue",hi,lo);
    quoteGraph(quotesSell,gfxs,"red",hi,lo);
    backwardGraph(quotesEMA1,gfxs,"black",hi,lo);


    // Hi and Lo texts
    gfxs.font = "12px Arial";
    gfxs.fillStyle = "black";
    const hiX = 20;
    gfxs.fillText("Hi:"+ hi, hiX,20);
    gfxs.fillText("Lo:"+ lo, hiX,40);
    //gfxs.fillText("EMA18:"+ ema, hiX,60);

}

function calcY(v, hi, lo) {
    return (1-((v - lo) / (hi - lo))) * (canvasH-canvasMargin) + canvasMargin/2;
}

function calcX(i) {
    return (i * 2 + canvasMargin/2);
}

function quoteGraph( arr, gfxCtx, color, hi, lo) {
    gfxCtx.beginPath();
    gfxCtx.moveTo(canvasMargin/2,calcY(arr[0],hi,lo));
    for(let i=1; i< arr.length; i++){
        let val = arr[i];

        let y = calcY(val, hi, lo);
        let x = calcX(i);
        if(val>0.01) gfxCtx.lineTo(x,y);
    };

    gfxCtx.strokeStyle = color;
    gfxCtx.stroke();
    gfxCtx.closePath();
}

function backwardGraph( arr, gfxCtx, color, hi, lo) {
    let ema = 0.0;
    gfxCtx.beginPath()
    gfxCtx.moveTo(arr.length,arr[arr.length]);
    for( let i=arr.length; i >0 ; i--){
        let eavg = arr[i];
        let rng = hi - lo;
        let y = (1-((eavg - lo) / rng)) * (canvasH-canvasMargin) + canvasMargin/2;
        let x = i * 2 + canvasMargin/2;
        gfxCtx.lineTo(x,y);
    }
    ema = arr[arr.length-1];
    gfxCtx.strokeStyle = color;
    gfxCtx.stroke();
    gfxCtx.closePath();
}

// Credit: w3 schools example: https://www.w3schools.com/howto/howto_js_draggable.asp
function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}