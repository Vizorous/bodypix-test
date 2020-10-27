import React, { useEffect, useRef, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import image from "./test.jpg";
import * as bodyPix from "@tensorflow-models/body-pix";
import * as output from "./output_rendering_util";
import imgJson from "./img.json";
import paper from "paper/dist/paper-core";
import hull from "hull.js";
import simplify from "./simplify";
function App() {
  // console.log(window);

  // Keep global references to both tools, so the HTML
  // links below can access them.

  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const canvas2Ref = useRef(null);
  const [width, setWidth] = useState(700);
  const [height, setHeight] = useState(1244);
  const [loaded, setLoaded] = useState(false);
  const [scaleUp, setScaleUp] = useState(5);
  // const [mask, setMask] = useState(undefined);
  async function loadAndPred(scaleUp) {
    // console.log("execution started");

    const net = await bodyPix.load({
      architecture: "MobileNetV1",
      outputStride: 16,
      multiplier: 1,
      quantBytes: 2,
    });
    // console.log(imageRef);

    const segmentation = await net.segmentMultiPerson(imageRef.current, {
      maxDetections: 4,
      internalResolution: "full",
    });
    // console.log(segmentation);
    const foregroundColor = { r: 255, g: 255, b: 255, a: 255 };
    const backgroundColor = { r: 0, g: 0, b: 0, a: 0 };
    const maskImgData = await bodyPix.toMask(
      segmentation,
      foregroundColor,
      backgroundColor
      // true
    );
    const mask = output.createMask(maskImgData);
    let ctx = canvasRef.current.getContext("2d");
    // debugger;
    drawOutline(mask, canvas2Ref.current, scaleUp);
    ctx.drawImage(
      imageRef.current,
      0,
      0,
      imageRef.current.clientWidth,
      imageRef.current.clientHeight
    );
    // ctx.drawImage(
    //   mask,
    //   0,
    //   0,
    //   imageRef.current.clientWidth,
    //   imageRef.current.clientHeight
    // );
    // console.log(
    //   mask.data.forEach((element, index) => {
    //     if (element !== 0) {
    //       console.log(element, index);
    //     }
    //   })
    // );
    // console.log(mask);

    // var json = JSON.stringify(mask);
    // var blob = new Blob([json], { type: "application/json" });
    // var url = URL.createObjectURL(blob);

    // var a = document.createElement("a");
    // a.download = "backup.json";
    // a.href = url;
    // a.textContent = "Download backup.json";

    // document.getElementById("root").appendChild(a);
    // localStorage.setItem("mask", JSON.stringify(mask));
    // console.log(mask);

    // output.drawMask(
    //   [canvasRef.current, canvas2Ref.current],
    //   imageRef,
    //   mask,
    //   255
    // );
  }

  const drawPixelOutline = (mask, ctx, scaleUp, width, height) => {
    var dArr = [-1, -1, 0, -1, 1, -1, -1, 0, 1, 0, -1, 1, 0, 1, 1, 1], // offset array
      i = 0, // iterator
      x = 0, // final position
      y = 0;
    for (; i < dArr.length; i += 2)
      ctx.drawImage(mask, x + dArr[i] * scaleUp, y + dArr[i + 1] * scaleUp);

    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "destination-out";
    // ctx2.drawImage(blurredMask, 0, 0, width, height);
    ctx.fillStyle = "#FFFFFF";
    var s = scaleUp - 1; // thickness scale
    i = 0; // iterator
    x = 0; // final position
    y = 0;
    for (; i < dArr.length; i += 2)
      ctx.drawImage(mask, x + dArr[i] * s, y + dArr[i + 1] * s);
    // debugger;
    debugger;
    console.log(width, height);

    return ctx.getImageData(0, 0, width, height);
  };

  const drawOutline = (mask, canvas, scaleUp) => {
    {
      if (scaleUp < 1) {
        scaleUp = 1;
      }
      // console.log(canvas.width, canvas.height);

      var ctx = canvas.getContext("2d");
      // console.log(ctx);
      // console.log(canvas.width);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const imgData = drawPixelOutline(
        mask,
        ctx,
        scaleUp,
        canvas.width,
        canvas.height
      );
      ctx.putImageData(imgData, 0, 0);
      // debugger;

      let pos = [];
      // let j=0;
      for (let i = 0; i < imgData.data.length; i += 4) {
        if (imgData.data[i] !== 0) {
          // console.log(i, imgData.data[i + 1], imgData.data[i]);
          var x = (i / 4) % canvas.width;
          var y = Math.floor(i / 4 / canvas.width);
          pos.push([x, y]);
        }
      }
      console.log(canvas.width, canvas.height);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";
      const hullPos = hull(pos, 40);
      const simple = simplify(hullPos, 5, false);

      paper.project.activeLayer.removeChildren();
      var myPath = new paper.Path({
        segments: hullPos,
      });
      myPath.strokeColor = "#F85A40";
      // myPath.add(new paper.Point(0, 0));
      // myPath.add(new paper.Point(100, 50));
      myPath.strokeWidth = 2;
      myPath.simplify(15   );
      const length1 = myPath.length;
      const offset1 = length1 * 0.05;
      const offsetLocation1 = myPath.getLocationAt(offset1);
      var myPath1 = myPath.splitAt(offsetLocation1);
      const length2 = myPath1.length;
      const offset2 = length2 * 0.9;
      const offsetLocation2 = myPath1.getLocationAt(offset2);
      var myPath2 = myPath1.splitAt(offsetLocation2);
      // var myPath3 = myPath.splitAt(offsetLocation2);

      myPath1.strokeColor = "green";
      myPath1.visible = false;
      // myPath2.strokeColor = "red";
      // myPath3.strokeColor = "green";
      // myPath2.visible = false;
      // myPath3.visible = false;
      // ctx2.fillStyle = '#f00';

      // ctx.beginPath();
      // hullPos.forEach((item, index) => {
      //   if (index === 0) {
      //     ctx.moveTo(item[0], item[1]);
      //   } else {
      //     ctx.lineTo(item[0], item[1]);
      //   }
      // });
      // ctx.closePath();
      // ctx.strokeStyle = "magenta";
      // ctx.beginPath();
      // const simple = simplify(hullPos, 5, false);

      // ctx.moveTo(simple[0][0], simple[0][1]);
      // for (let i = 1; i < [simple.length - 2]; i++) {
      //   ctx.bezierCurveTo(
      //     simple[i][0],
      //     simple[i][1],
      //     simple[i + 1][0],
      //     simple[i + 1][1],
      //     simple[i + 2][0],
      //     simple[i + 2][1]
      //   );
      // }
      // // simple.forEach((item, index) => {
      // //   if (index === 0) {
      // //   } else {
      // //   }
      // // });
      // ctx.closePath();
      // ctx.strokeStyle = "yellow";
      // ctx.stroke();
      // console.log("done");
    }
  };
  useEffect(() => {
    console.log("testing cdm");
    paper.install(window);
    paper.setup(document.getElementById("line-canvas"));

    // setWidth(imageRef.current.width);
    // console.log(imageRef);
    // loadAndPred();
    // try {
    // console.log(imgJson);
    // const uintarr = new Uint8ClampedArray(imgJson.data);
    // console.log(height, width);
    // const mask = new ImageData(uintarr, height, width);
    // console.log(imgJson);
    // output.drawMask(
    //   [canvasRef.current, canvas2Ref.current],
    //   imageRef,
    //   mask,
    //   255
    // );
    // } catch (e) {
    //   console.log(e);
    // }
  }, []);
  useEffect(() => {
    // if (mask) {
    //   // drawOutline(mask, canvas2Ref.current, scaleUp);
    // }
  }, [scaleUp]);

  useEffect(() => {
    if (loaded) {
      // loadAndPred();
      // console.log(loaded);

      // console.log(imgJson.data);
      // const uintarr = new Uint8ClampedArray(Object.values(imgJson.data));
      // // console.log(uintarr);

      // // console.log(height, width);
      // const maskImgData = new ImageData(uintarr, width);
      // const mask = output.createMask(maskImgData);
      // output.drawMask(
      //   [canvasRef.current, canvas2Ref.current],
      //   imageRef,
      //   maskImgData,
      //   255
      // );
      // drawOutline(mask, canvas2Ref.current, scaleUp);
      // setMask(mask);
      loadAndPred(scaleUp);
    }
  }, [loaded]);
  return (
    <div className="App">
      <div>
        <img
          src={image}
          style={{
            width: 699,
            height: 1244,
            position: "absolute",
            top: "-1000px",
            left: "-1000px",
          }}
          ref={imageRef}
          onLoad={() => {
            console.log("on load");
            // console.log("going on load");
            setHeight(imageRef.current.height);
            setWidth(imageRef.current.width);
            var size = new paper.Size(width, height);
            setLoaded(true);
          }}></img>
        <input
          value={scaleUp}
          onChange={(e) => {
            setScaleUp(e.currentTarget.value);
          }}></input>
        <div style={{ display: "flex" }}>
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{ position: "absolute" }}></canvas>
          <canvas
            ref={canvas2Ref}
            width={width}
            height={height}
            style={{ position: "absolute" }}
            id="line-canvas"></canvas>
        </div>
      </div>
    </div>
  );
}

export default App;
