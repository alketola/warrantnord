# warrantnord
## What it is

**WarrantNord** is a _Tampermonkey_ user script (JavaScript) for extracting and 
displaying information from Nordnet.fi Certificate, Warrant and mini futures pages.

It is an ugly, monolithic script. Started with no particular design in mind,
just trying to get it to do something. I hope I don't get _doomed_ by this.
(I know I already am doomed by many things). In my defence, I have to say, JS is 
not my main programming language.

I started this because I'm frustrated with the free web pages of stock brokers.
After eQ online was sold to Nordnet, the functionality of the pages was 
reduced dramatically. I did not like the paid InFront either.

## Functionality

Currently, it shows buy (blue) and sell (red) quotes in graphical form updated 
with the interval of 1 s. In addition, there is an EMA-9 graph (black) running 
along the Sell quote graph. You can move the window around.

## Advice and bugs

1. The window dowsn't always appear, you need to reload the page
2. The window doesn't always close, you need to reload the page
3. The graph may get stuck, you may need to reload the page
4. Sometimes the quotes cannot be found by the script.

Nordnet doesn't code their pages with constant cell ids so they must be 
selected from DOM by relative means.

The URLs of the pages with which this is supposed to work are in the header 
comment, in lines with "match".

There are some outcommented lines that change the color of the page. 
They can be used to find the elements in the page by DOM by trial and error.

## Requires
Runs on Chromium or Google Chrome with Tampermonkey extension installed.
Tampermonkey 4.10 ( the only one which this has been used on).
