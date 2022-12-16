import React from "react";
import { Link } from "react-router-dom";
import JoditEditor from "jodit-react";
import CodeEditor from '@uiw/react-textarea-code-editor';

const memory = []
const memeorySize = 64;
const addBuffer = []
const addBufferSize = 4;
const loadBuffer = []
const loadBufferSize = 4;
const multBuffer = []
const multBufferSize = 4;
const storeBuffer = []
const storeBufferSize = 4;


const Home = () => {
    const [code, setCode] = React.useState('');
    const textRef = React.useRef();

    return (
        <>
        <div>
        <h3>mips Code</h3>
        <CodeEditor
          value={code}
          ref={textRef}
          language="mips"
          placeholder="Please enter JS code."
          onChange={(evn) => setCode(evn.target.value)}
          padding={15}
          style={{
            fontFamily:
              "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
            fontSize: 12
          }}
        />
      </div>
      </>
        
    )

}

export default Home