// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).

// This shows the HTML page in "ui.html".
import { getContrast } from 'polished';
import * as Color from 'color';
figma.showUI(__html__);
figma.ui.resize(300, 500);
let allPaintStyles: PaintStyle[];
let fgPaintStyles: PaintStyle[] = [];
let bgPaintStyles: PaintStyle[] = [];
let ColorGrid: SceneNode[] = [];

const CELL_WIDTH = 100;
const CELL_HEIGHT = 50;

const MIN_CONTRAST_RATIO_WCAG_NORMAL = 4.5;
const MIN_CONTRAST_RATIO_WCAG_LARGE = 3;
const MIN_CONTRAST_RATIO_APCA = 3;

function getSolidColor(paintStyle: PaintStyle){
  if (paintStyle.paints.length == 1 ){
    const paint = paintStyle.paints[0]
    if (paint.type === 'SOLID'){
      return paint.color;
    } else return {r:0, g:0, b:0}
  } else return {r:0, g:0, b:0}
}


function checkContrastRatio(fgPaintStyles: PaintStyle[], bgPaintStyles: PaintStyle[]) {
  // Extract the color values from the paint styles
  const fgColors = fgPaintStyles.map((paintStyle) => getSolidColor(paintStyle));
  const bgColors = bgPaintStyles.map((paintStyle) => getSolidColor(paintStyle));

  // Convert the colors to the appropriate format
  const fgColorObjects = fgColors.map((color) => Color.rgb(color.r, color.g, color.b));
  const bgColorObjects = bgColors.map((color) => Color.rgb(color.r, color.g, color.b));
  const fgColorsLab = fgColorObjects.map((color) => color.lab().array());
  const bgColorsLab = bgColorObjects.map((color) => color.lab().array());
  const fgColorsRGB = fgColorsLab.map((color) => Color.lab(color).rgb().object());
  const bgColorsRGB = bgColorsLab.map((color) => Color.lab(color).rgb().object());
  const fgColorsString = fgColorsRGB.map((color) => Color.rgb(color.r, color.g, color.b).string());
  const bgColorsString = bgColorsRGB.map((color) => Color.rgb(color.r, color.g, color.b).string());

  // Calculate the contrast ratio for each pair of colors
  const contrastRatios = fgColorsString.map((fgColor, i) => {
    const bgColor = bgColorsString[i];
    return getContrast(fgColor, bgColor);
  });

  // Check if the contrast ratios meet the standards
  const wcagNormal = contrastRatios.every((ratio) => ratio >= MIN_CONTRAST_RATIO_WCAG_NORMAL);
  const wcagLarge = contrastRatios.every((ratio) => ratio >= MIN_CONTRAST_RATIO_WCAG_LARGE);
  const apca = contrastRatios.every((ratio) => ratio >= MIN_CONTRAST_RATIO_APCA);

  // Return the results
  return { contrastRatios, wcagNormal, wcagLarge, apca };
}

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = msg => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  if (msg.type === 'generate') {
    console.log(msg.fg, msg.bg)
    allPaintStyles = figma.getLocalPaintStyles();
    msg.fg.forEach((element: String) => {
      FindAllStyles(element, fgPaintStyles)
    });
    msg.bg.forEach((element: String) => {
      FindAllStyles(element, bgPaintStyles)
    });
    GenerateColorGrid(msg.fg.length, msg.bg.length);
    // const nodes: SceneNode[] = [];
    // for (let i = 0; i < msg.count; i++) {
    //   const rect = figma.createRectangle();
    //   rect.x = i * 150;
    //   rect.fills = [{type: 'SOLID', color: {r: 1, g: 0.5, b: 0}}];
    //   figma.currentPage.appendChild(rect);
    //   nodes.push(rect);
    // }
    // figma.currentPage.selection = nodes;
    // figma.viewport.scrollAndZoomIntoView(nodes);
  }

  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
};



function FindAllStyles(name:String, styleList:PaintStyle[]){
  allPaintStyles.forEach(element => {
    const paintNameParts = getNameParts(element.name)
    if (paintNameParts[paintNameParts.length-1] === name){
      styleList.push(element)
      console.log(element.name)
    }
  });
}

const getNameParts = (name: string) => {
  const nameParts = name.split('/').filter((part: string) => !!part)
  return nameParts.map((part: string) => part.trim())
}

const getNamePrefix = (name: string): string => {
  const pathParts = getNameParts(name)
  pathParts.pop()
  return pathParts.join('/')
}

function GenerateContrastGrid(){
  
}

function GenerateColorGrid(col: number, row: number){
  const colorGridFrame = figma.createFrame()
  colorGridFrame.layoutMode = 'VERTICAL';
  for (let i = 0; i < bgPaintStyles.length; i++) {
    const bg = bgPaintStyles[i];
    for (let j = 0; j < fgPaintStyles.length; j++) {
      const fg = fgPaintStyles[j];
      if (getNamePrefix(fg.name) === getNamePrefix(bg.name)){
        GenerateColorCell(fg, bg, colorGridFrame);
      }
    }
  }

  figma.currentPage.selection = [colorGridFrame];
  figma.viewport.scrollAndZoomIntoView([colorGridFrame]);
}

function GenerateColorCell(fg:PaintStyle, bg:PaintStyle, parent:FrameNode){
  const frame = figma.createFrame()
  // frame.x = 0;
  // frame.y = 0;

  // Set size to 1280 x 720
  frame.name = fg.name + ' on ' + bg.name;
  frame.layoutMode = 'VERTICAL';
  frame.primaryAxisAlignItems = "CENTER";
  frame.counterAxisAlignItems = 'CENTER';
  frame.itemSpacing = 8;
  frame.fillStyleId = bg.id;

  frame.resize(CELL_WIDTH, CELL_HEIGHT)

  createCellNote(frame, 'Text', "Bold", 16, fg.id)
  // createCellNote(frame, frame.name, "Regular", 16, fg.id)

  // ColorGrid.push(frame);
  parent.appendChild(frame)

  // const annnotation = figma.createText()
  // annnotation.characters = 'Text';
  // annnotation.fontSize = 24;
  // annnotation.fillStyleId = fg.id;

  // const frameName = figma.createText()
  // frameName.characters = frame.name;
  // frameName.fontSize = 14;
  // frameName.fillStyleId = fg.id;
  // frameName.opacity = 0.6;
  
}

function createCellNote(parent:FrameNode, name: string, weight: string, size: number, fillId: string){
  (async () => {
    const text = figma.createText()
    await figma.loadFontAsync({ family: "Inter", style: weight })
    text.fontName = { family: "Inter", style: weight };
    text.characters = name;
    text.fontSize = size;
    text.fillStyleId = fillId;

    parent.appendChild(text)
  })()
}