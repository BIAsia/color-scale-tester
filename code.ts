// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).

// This shows the HTML page in "ui.html".
figma.showUI(__html__);
figma.ui.resize(300, 500);
let allPaintStyles: PaintStyle[];
let fgPaintStyles: PaintStyle[] = [];
let bgPaintStyles: PaintStyle[] = [];
let ColorGrid: SceneNode[] = [];

const CELL_WIDTH = 100;
const CELL_HEIGHT = 50;

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