import React, { Children } from "react";
import { Link } from "react-router-dom";
import JoditEditor from "jodit-react";
import "./Home.css";
import CodeEditor from '@uiw/react-textarea-code-editor';
import AddBuffer from "../components/AddBuffer";
import LoadBuffer from "../components/LoadBuffer";
import MultBuffer from "../components/MultBuffer";
import StoreBuffer from "../components/StoreBuffer";
import RegFile from "../components/RegFile";
import InstructionQueueElem from "../components/InstructionQueueElem";
import Instructions from "../components/Instructions";
import GlobalBuffer from "../components/GlobalBuffer";

console.warn = () => { };

var memory = Array(252).fill(null).map(() => (0));
for (let i = 0; i < 252; i++) {
    if (i == 80)
        memory[i] = 5;
    else
        memory[i] = 20;
}

// Buffers
var addBuffer = Array(4).fill(null).map(() => (new AddBuffer(0, null, null, null, null, null, null)))
var loadBuffer = Array(3).fill(null).map(() => (new LoadBuffer(0, null, null)))
var multBuffer = Array(2).fill(null).map(() => (new MultBuffer(0, null, null, null, null, null, null)))
var storeBuffer = Array(4).fill(null).map(() => (new StoreBuffer(0, null, null, null, null, null, null)))
var regFile = Array(10).fill(null).map(() => (new RegFile(null, 0)));
var globalBuffer = [];



// Latencies
var addLatency = 2;
var subLatency = 2;
var loadLatency = 2;
var multLatency = 10;
var divLatency = 20;
var storeLatency = 2;

var instructionQueue = [] // array of instructionQueueElem
var instQueueIndex = 0;
var cycle = 1;
// test code
const testMips = "L.D F0, 80\nSUB.D F4, F0, F2\nADD.D F4, F4, F2\nS.D F4, 80"





// checkGlobalBuffer
const checkAndGetFromGlobalBuffer = (bufferName) => {
    for (let i = 0; i < globalBuffer.length; i++) {
        if (globalBuffer[i].getBufferName() === bufferName) {
            return globalBuffer[i].getResult();
        }
    }
}
const removeFromGlobalBuffer = (bufferName) => {
    for (let i = 0; i < globalBuffer.length; i++) {
        if (globalBuffer[i].getBufferName() === bufferName) {
            globalBuffer.splice(i, 1); // remove from position i 1 item
        }
    }
}
// check if the instruction has any dependencies
function checkDependencies(instruction) {
    var QJTuple = [null, null];
    for (let i = 0; i < instQueueIndex; i++) {
        if (instructionQueue[i].getWriteResult() === null) {
            if (instruction.getJ() === instructionQueue[i].getReturnReg()) {
                QJTuple[0] = instructionQueue[i].getAsscbufferName();
            }
            if (instruction.getK() === instructionQueue[i].getReturnReg()) {
                QJTuple[1] = instructionQueue[i].getAsscbufferName();
            }
        }
    }
    return QJTuple; // returns dependencies as a tuple
}

// A store exclusive dependency check
function checkDependencyStore(instruction) {
    var QJ = null;
    for (let i = 0; i < instQueueIndex; i++) {
        if (instructionQueue[i].getWriteResult() === null) {
            if (instruction.getReturnReg() === instructionQueue[i].getReturnReg()) {
                QJ = instructionQueue[i].getAsscbufferName();
            }
        }
    }
    return QJ; // returns the store dependency

}

// check and fetch the value from register file
const fetchCheckValue = (regName) => {
    var valueStateTuple = [null, null];
    for (let i = 0; i < regFile.length; i++) {
        if (regName === regFile[i].getRegName()) {
            if (regFile[i].getQi() === null) {
                valueStateTuple[0] = regFile[i].getValue();
                valueStateTuple[1] = true;
                //console.log("REGISTER NAME: " + regName + " [Value,State] = " + valueStateTuple); //--------LOGGING
                return valueStateTuple; // return true and the value if the value is ready
            }
            else {
                valueStateTuple[0] = regFile[i].getValue();
                valueStateTuple[1] = false;
                //console.log("REGISTER NAME: " + regName + " [Value,State] = " + valueStateTuple);//--------LOGGING
                return valueStateTuple; // return false and the value if the value is not ready (register is waiting for an instruction)
            }
        }
    }
}
const casualFetchValue = (regName) => {
    for (let i = 0; i < regFile.length; i++) {
        if (regName === regFile[i].getRegName()) {
            return regFile[i].getValue();
        }
    }
}
// change value in the register file
const changeRegValue = (buffer, value) => {
    for (let i = 0; i < regFile.length; i++) {
        if (buffer.getAsscInst().getReturnReg() === regFile[i].getRegName()) {
            regFile[i].setValue(value);
            if (buffer.getBufferName() === regFile[i].getQi()) {
                regFile[i].setQi(null);
            }
            break;
        }
    }
}
// Mark the register file with the buffer name (Q)
const markRegFile = (regName, bufferName) => {
    //console.log(regName === regFile[0].getRegName()); -------------------> LOGGING
    //console.log(regName); ---------------------------------- LOGGING
    for (let i = 0; i < regFile.length; i++) {
        if (regName === regFile[i].getRegName()) {
            regFile[i].setQi(bufferName);
            break;
        }
    }
}
const checkWriteBack = () => {
    //////////////////////////////////////////////////////////////////////////////////////////////////////// CONTINUE REQUIRED HERE
    // check all buffers for instructions that are waiting for writeback
    for (let i = 0; i < storeBuffer.length; i++) {
        var valueJ = null;
        if (storeBuffer[i].getBusy() === 1 && storeBuffer[i].getV() === null) {
            valueJ = checkAndGetFromGlobalBuffer(storeBuffer[i].getQ());
            if (storeBuffer[i].getV() === null && valueJ != null) {
                storeBuffer[i].setV(valueJ);
                storeBuffer[i].setQ(null);
            }
            if (storeBuffer[i].getV() != null) {
                storeBuffer[i].setTime(storeLatency);
            }
        }
    }

    for (let i = 0; i < addBuffer.length; i++) {
        var valueJ = null;
        var valueK = null;
        //console.log(addBuffer[i].getBusy() === 1 && (addBuffer[i].getVj() === null || addBuffer[i].getVk() === null));
        if (addBuffer[i].getBusy() === 1 && (addBuffer[i].getVj() === null || addBuffer[i].getVk() === null)) {
            //console.log(fetchCheckValue(addBuffer[i].getAsscInst().getJ()));
            valueJ = checkAndGetFromGlobalBuffer(addBuffer[i].getQj());
            //console.log("ValueJ: " + valueJ);

            // ---------------------- VALUE ONLY GETS SET ONCE ---------------------- //
            //console.log(addBuffer[i].getVj() === null && valueJ[1] === true);
            if (addBuffer[i].getVj() === null && valueJ != null) {
                addBuffer[i].setVj(valueJ);
                addBuffer[i].setQj(null);
            }
            valueK = checkAndGetFromGlobalBuffer(addBuffer[i].getQk());
            //console.log("ValueK: " + valueK);
            if (addBuffer[i].getVk() === null && valueK != null) {
                addBuffer[i].setVj(valueK);
                addBuffer[i].setVk(null);
            }
            if (addBuffer[i].getVj() != null && addBuffer[i].getVk() != null) {
                if (addBuffer[i].getAsscInst().getInstruction() === "add.d") {
                    addBuffer[i].setTime(addLatency);
                }
                else {
                    addBuffer[i].setTime(subLatency);
                }
            }
        }
    }
    for (let i = 0; i < multBuffer.length; i++) {
        var valueJ = null;
        var valueK = null;
        //console.log(multBuffer[i].getBusy() === 1 && (multBuffer[i].getVj() === null || multBuffer[i].getVk() === null));
        if (multBuffer[i].getBusy() === 1 && (multBuffer[i].getVj() === null || multBuffer[i].getVk() === null)) {
            //console.log(fetchCheckValue(multBuffer[i].getAsscInst().getJ()));
            valueJ = checkAndGetFromGlobalBuffer(multBuffer[i].getQj());
            //console.log("ValueJ: " + valueJ);

            // ---------------------- VALUE ONLY GETS SET ONCE ---------------------- //
            //console.log(multBuffer[i].getVj() === null && valueJ[1] === true);
            if (multBuffer[i].getVj() === null && valueJ != null) {
                multBuffer[i].setVj(valueJ);
                multBuffer[i].setQj(null);
            }
            valueK = checkAndGetFromGlobalBuffer(multBuffer[i].getQk());
            //console.log("ValueK: " + valueK);
            if (multBuffer[i].getVk() === null && valueK != null) {
                multBuffer[i].setVj(valueK);
                multBuffer[i].setVk(null);
            }
            if (multBuffer[i].getVj() != null && multBuffer[i].getVk() != null) {
                if (multBuffer[i].getAsscInst().getInstruction() === "mul.d") {
                    multBuffer[i].setTime(multLatency);
                }
                else {
                    multBuffer[i].setTime(divLatency);
                }
            }
        }
    }
}

const checkBuffersToBeCleared = () => {
    for (let i = 0; i < addBuffer.length; i++) {
        if (addBuffer[i].getBusy() === 1 && addBuffer[i].getAsscInst().getTobeRemoved() === true) {
            clearAddBuffer(addBuffer[i]);
        }
    }
    for (let i = 0; i < multBuffer.length; i++) {
        if (multBuffer[i].getBusy() === 1 && multBuffer[i].getAsscInst().getTobeRemoved() === true) {
            clearMultBuffer(multBuffer[i]);
        }
    }
    for (let i = 0; i < loadBuffer.length; i++) {
        if (loadBuffer[i].getBusy() === 1 && loadBuffer[i].getAsscInst().getTobeRemoved() === true) {
            clearLoadBuffer(loadBuffer[i]);
        }
    }
    for (let i = 0; i < storeBuffer.length; i++) {
        if (storeBuffer[i].getBusy() === 1 && storeBuffer[i].getAsscInst().getTobeRemoved() === true) {
            clearStoreBuffer(storeBuffer[i]);
        }
    }
}

// ---------------------------------- INSTURCTION EXECUTION FUNCTIONS ---------------------------------- //
// load from memory
const loadFromMemory = (address) => {
    console.log("Value loaded from memory address [" + address + "] is: " + memory[address]);
    return memory[address];
}
const storeToMemory = (address, value) => {
    memory[address] = value;
    console.log("Value [" + value + "] stored to memory address [" + address + "]");
}
const addFLoat = (Vi, Vj) => {
    console.log("Value added: " + Vi + " + " + Vj);
    return Vi + Vj;
}
const subFloat = (Vi, Vj) => {
    console.log("Value subtracted: " + Vi + " - " + Vj);
    return Vi - Vj;
}
const multFLoat = (Vi, Vj) => {
    return Vi * Vj;
}
const divFloat = (Vi, Vj) => {
    return Vi / Vj;
}
// ------------------------------------------------------------------------------------------------------ //

// ---------------------------------- CLEAR BUFFER FUNCTIONS ---------------------------------- //
const clearLoadBuffer = (buffer) => {
    buffer.setBusy(0);
    buffer.setAddress(null);
    buffer.setAsscInst(null);
    buffer.setTime(null);
}
const clearAddBuffer = (buffer) => {
    buffer.setBusy(0);
    buffer.setOperation(null);
    buffer.setAsscInst(null);
    buffer.setVj(null);
    buffer.setVk(null);
    buffer.setQj(null);
    buffer.setQk(null);
    buffer.setTime(null);
}
const clearMultBuffer = (buffer) => {
    buffer.setBusy(0);
    buffer.setOperation(null);
    buffer.setAsscInst(null);
    buffer.setVj(null);
    buffer.setVk(null);
    buffer.setQj(null);
    buffer.setQk(null);
    buffer.setTime(null);
}
const clearStoreBuffer = (buffer) => {
    buffer.setBusy(0);
    buffer.setAsscInst(null);
    buffer.setAddress(null);
    buffer.setV(null);
    buffer.setQ(null);
    buffer.setTime(null);
}
// ------------------------------------------------------------------------------------------------------ //
// ---------------------------------- RESET FUNCTIONS ---------------------------------- //
const resetLoadBuffer = () => {
    for (let i = 0; i < loadBuffer.length; i++) {
        clearLoadBuffer(loadBuffer[i]);
    }
}
const resetAddBuffer = () => {
    for (let i = 0; i < addBuffer.length; i++) {
        clearAddBuffer(addBuffer[i]);
    }
}
const resetMultBuffer = () => {
    for (let i = 0; i < multBuffer.length; i++) {
        clearMultBuffer(multBuffer[i]);
    }
}
const resetStoreBuffer = () => {
    for (let i = 0; i < storeBuffer.length; i++) {
        clearStoreBuffer(storeBuffer[i]);
    }
}
const resetGlobalBuffer = () => {
    globalBuffer = [];
}
const resetRegFile = () => {
    for (let i = 0; i < regFile.length; i++) {
        regFile[i].setValue(i);
        regFile[i].setQi(null);
    }
}
// ------------------------------------------------------------------------------------------------------ //


// ---------------------------------- LOAD INSTRUCTIONs FUNCTION ---------------------------------- //
const loadInstruction = (mips64Instructions) => {
    console.log("CYCLE: " + (cycle - 1) + "");
    console.log(regFile);
    console.log(loadBuffer);
    console.log(storeBuffer);
    console.log(addBuffer);
    console.log(multBuffer);
    console.log(globalBuffer);

    // reseting the algorithm
    instructionQueue.length = 0;
    instQueueIndex = 0;
    cycle = 1;
    resetLoadBuffer();
    resetAddBuffer();
    resetMultBuffer();
    resetStoreBuffer();
    resetGlobalBuffer();
    resetRegFile();

    // split the instructions into an array
    var tempArr;
    tempArr = mips64Instructions.split("\n");
    // split the commas and spaces
    for (let i = 0; i < tempArr.length; i++) {
        tempArr[i] = tempArr[i].split(/[\s,]+/);
    }
    console.log(tempArr);
    for (let i = 0; i < tempArr.length; i++) {

        // convert all the instructions to lower case

        for (let j = 0; j < tempArr[i].length; j++) {
            tempArr[i][j] = tempArr[i][j].toLowerCase();
        }

        // pushing the instruction into the instruction queue

        if (tempArr[i][0] === 'l.d' || tempArr[i][0] === 's.d') {
            instructionQueue.push(new InstructionQueueElem(tempArr[i][0], tempArr[i][1], tempArr[i][2], null, null, null, null, null, null));
            //instructionQueue[i].setReturnReg(tempArr[i][1]);
            //instructionQueue[i].setJ(tempArr[i][2]);
        }
        else {
            instructionQueue.push(new InstructionQueueElem(tempArr[i][0], tempArr[i][1], tempArr[i][2], tempArr[i][3], null, null, null, null, null));
            //instructionQueue[i].setReturnReg(tempArr[i][1]);
            //instructionQueue[i].setJ(tempArr[i][2]);
            //instructionQueue[i].setK(tempArr[i][3]);
        }
    }
    console.log(instructionQueue);
    console.log("------------------------------------------------------------------");
    return instructionQueue;
}
// --------------------------------------------------------------------------------------- //
const executionOver = () => {
    if (instQueueIndex >= instructionQueue.length) {
        for (let i = 0; i < loadBuffer.length; i++) {
            if (loadBuffer[i].getBusy() === 1) {
                return false;
            }
        }
        for (let i = 0; i < addBuffer.length; i++) {
            if (addBuffer[i].getBusy() === 1) {
                return false;
            }
        }
        for (let i = 0; i < multBuffer.length; i++) {
            if (multBuffer[i].getBusy() === 1) {
                return false;
            }
        }
        for (let i = 0; i < storeBuffer.length; i++) {
            if (storeBuffer[i].getBusy() === 1) {
                return false;
            }
        }
        return true;
    }
    return false;
}
const executeNextCycle = () => {

    var dependencies;
    // ---------------------------------- WRITE BACK ----------------------------------
    ///////////////////////////////////////////////////////////////////////////////////////////// CONTINUE REQUIRED HERE
    // write back (Where the execution takes place) && clear buffer
    for (let i = 0; i < instQueueIndex; i++) {
        if (instructionQueue[i].getExecutionEnd() != null && instructionQueue[i].getWriteResult() === null) {
            // instructions write back in FIFO order
            instructionQueue[i].setWriteResultPriority(true);
            break;
        }
    }
    for (let i = 0; i < loadBuffer.length; i++) {
        if (loadBuffer[i].getBusy() === 1) {
            if (loadBuffer[i].getTime() === 0 && loadBuffer[i].getAsscInst().getExecutionEnd() != null && loadBuffer[i].getAsscInst().getWriteResultPriority()) {
                loadBuffer[i].getAsscInst().setWriteResultPriority(false);
                loadBuffer[i].getAsscInst().setWriteResult(cycle);
                var loadedValue = loadFromMemory(loadBuffer[i].getAddress());
                globalBuffer.push(new GlobalBuffer(loadBuffer[i].getBufferName(), loadedValue));
                changeRegValue(loadBuffer[i], loadedValue);
                loadBuffer[i].getAsscInst().setTobeRemoved(true);
            }
        }
    }
    for (let i = 0; i < storeBuffer.length; i++) {
        if (storeBuffer[i].getBusy() === 1) {
            if (storeBuffer[i].getTime() === 0 && storeBuffer[i].getAsscInst().getExecutionEnd() != null && storeBuffer[i].getAsscInst().getWriteResultPriority()) {
                storeBuffer[i].getAsscInst().setWriteResultPriority(false);
                storeBuffer[i].getAsscInst().setWriteResult(cycle);
                storeToMemory(storeBuffer[i].getAddress(), storeBuffer[i].getV());
                storeBuffer[i].getAsscInst().setTobeRemoved(true);
            }
        }
    }
    for (let i = 0; i < addBuffer.length; i++) {
        if (addBuffer[i].getBusy() === 1) {
            if (addBuffer[i].getTime() === 0 && addBuffer[i].getAsscInst().getExecutionEnd() != null && addBuffer[i].getAsscInst().getWriteResultPriority()) {
                addBuffer[i].getAsscInst().setWriteResultPriority(false);
                addBuffer[i].getAsscInst().setWriteResult(cycle);
                if (addBuffer[i].getAsscInst().getInstruction() === "add.d") {
                    var result = addFLoat(addBuffer[i].getVj(), addBuffer[i].getVk());
                }
                else if (addBuffer[i].getAsscInst().getInstruction() === "sub.d") {
                    var result = subFloat(addBuffer[i].getVj(), addBuffer[i].getVk());
                }
                globalBuffer.push(new GlobalBuffer(addBuffer[i].getBufferName(), result));
                changeRegValue(addBuffer[i], result);
                addBuffer[i].getAsscInst().setTobeRemoved(true);
            }
        }
    }
    for (let i = 0; i < multBuffer.length; i++) {
        if (multBuffer[i].getBusy() === 1) {
            if (multBuffer[i].getTime() === 0 && multBuffer[i].getAsscInst().getExecutionEnd() != null && multBuffer[i].getAsscInst().getWriteResultPriority()) {
                multBuffer[i].getAsscInst().setWriteResultPriority(false);
                multBuffer[i].getAsscInst().setWriteResult(cycle);
                if (multBuffer[i].getAsscInst().getInstruction() === "mul.d") {
                    var result = multFLoat(multBuffer[i].getVj(), multBuffer[i].getVk());
                }
                else if (multBuffer[i].getAsscInst().getInstruction() === "div.d") {
                    var result = divFloat(multBuffer[i].getVj(), multBuffer[i].getVk());
                }
                globalBuffer.push(new GlobalBuffer(multBuffer[i].getBufferName(), result));
                changeRegValue(multBuffer[i], result);
                multBuffer[i].getAsscInst().setTobeRemoved(true);
            }
        }
    }

    // ---------------------------------- EXECUTION ----------------------------------
    ///////////////////////////////////////////////////////////////////////////////////////////// CONTINUE REQUIRED HERE
    // Execute the instructions in the instruction queue
    for (let i = 0; i < loadBuffer.length; i++) {
        if (loadBuffer[i].getBusy() === 1) {
            // set execution start time
            if (loadBuffer[i].getTime() === loadLatency) {
                loadBuffer[i].getAsscInst().setExecutionStart(cycle);
            }

            // executing the instructions
            if (loadBuffer[i].getTime() != 0) {
                loadBuffer[i].setTime(loadBuffer[i].getTime() - 1); // decrement the time
            }

            // check if execution is done and set the execution end time
            var startTime = loadBuffer[i].getAsscInst().getExecutionStart();
            var endTime = startTime + loadLatency - 1;
            if (loadBuffer[i].getTime() === 0 && cycle == endTime) {
                loadBuffer[i].getAsscInst().setExecutionEnd(cycle);
                console.log(loadBuffer[i].getAsscInst().getInstruction().toUpperCase() + " EXECUTION COMPLETE");
            }

        }
    }
    for (let i = 0; i < storeBuffer.length; i++) {
        if (storeBuffer[i].getBusy() === 1 && storeBuffer[i].getV() != null) {
            // set execution start time
            if (storeBuffer[i].getTime() === storeLatency) {
                storeBuffer[i].getAsscInst().setExecutionStart(cycle);
            }
            // executing the instructions
            if (storeBuffer[i].getTime() != 0) {
                storeBuffer[i].setTime(storeBuffer[i].getTime() - 1); // decrement the time
            }
            // check if execution is done and set the execution end time
            var startTime = storeBuffer[i].getAsscInst().getExecutionStart();
            var endTime = startTime + storeLatency - 1;
            if (storeBuffer[i].getTime() === 0 && cycle == endTime) {
                storeBuffer[i].getAsscInst().setExecutionEnd(cycle);
                console.log(storeBuffer[i].getAsscInst().getInstruction().toUpperCase() + " EXECUTION COMPLETE");
            }
        }
    }
    for (let i = 0; i < addBuffer.length; i++) {
        if (addBuffer[i].getBusy() === 1 && addBuffer[i].getVj() != null && addBuffer[i].getVk() != null) {
            // set execution start time
            if (addBuffer[i].getTime() === addLatency && addBuffer[i].getAsscInst().getInstruction() === "add.d") {
                addBuffer[i].getAsscInst().setExecutionStart(cycle);
            }
            else if (addBuffer[i].getTime() === subLatency && addBuffer[i].getAsscInst().getInstruction() === "sub.d") {
                addBuffer[i].getAsscInst().setExecutionStart(cycle);
            }
            // executing the instructions
            if (addBuffer[i].getTime() != 0 && addBuffer[i].getAsscInst().getExecutionStart() != null) {
                addBuffer[i].setTime(addBuffer[i].getTime() - 1); // decrement the time
            }
            // check if execution is done and set the execution end time
            var startTime = addBuffer[i].getAsscInst().getExecutionStart();
            if (addBuffer[i].getAsscInst().getInstruction() === "add.d")
                var endTime = startTime + addLatency - 1;
            else if (addBuffer[i].getAsscInst().getInstruction() === "sub.d")
                var endTime = startTime + subLatency - 1;
            //console.log(endTime);
            if (addBuffer[i].getTime() === 0 && cycle == endTime) {
                addBuffer[i].getAsscInst().setExecutionEnd(cycle);
                console.log(addBuffer[i].getAsscInst().getInstruction().toUpperCase() + " EXECUTION COMPLETE");
            }
        }
    }

    for (let i = 0; i < multBuffer.length; i++) {
        if (multBuffer[i].getBusy() === 1 && multBuffer[i].getVj() != null && multBuffer[i].getVk() != null) {
            // set execution start time
            if (multBuffer[i].getTime() === addLatency && multBuffer[i].getAsscInst().getInstruction() === "mul.d") {
                multBuffer[i].getAsscInst().setExecutionStart(cycle);
            }
            else if (multBuffer[i].getTime() === subLatency && multBuffer[i].getAsscInst().getInstruction() === "div.d") {
                multBuffer[i].getAsscInst().setExecutionStart(cycle);
            }
            // executing the instructions
            if (multBuffer[i].getTime() != 0 && multBuffer[i].getAsscInst().getExecutionStart() != null) {
                multBuffer[i].setTime(multBuffer[i].getTime() - 1); // decrement the time
            }
            // check if execution is done and set the execution end time
            var startTime = multBuffer[i].getAsscInst().getExecutionStart();
            if (multBuffer[i].getAsscInst().getInstruction() === "mul.d")
                var endTime = startTime + multLatency - 1;
            else if (multBuffer[i].getAsscInst().getInstruction() === "div.d")
                var endTime = startTime + divLatency - 1;
            //console.log(endTime);
            if (multBuffer[i].getTime() === 0 && cycle == endTime) {
                multBuffer[i].getAsscInst().setExecutionEnd(cycle);
                console.log(multBuffer[i].getAsscInst().getInstruction().toUpperCase() + " EXECUTION COMPLETE");
            }
        }
    }


    // ---------------------------------- ISSUE ----------------------------------
    // check if there is an instruction in the instruction queue
    if (instQueueIndex < instructionQueue.length) {

        if (instructionQueue[instQueueIndex].getInstruction() === 'l.d') {
            // check if there is an empty load buffer
            for (let i = 0; i < loadBuffer.length; i++) {
                if (loadBuffer[i].getBusy() === 0) {
                    removeFromGlobalBuffer(loadBuffer[i].getBufferName());
                    loadBuffer[i].setBusy(1);  // set the buffer to busy
                    dependencies = checkDependencies(instructionQueue[instQueueIndex]); // redundant
                    loadBuffer[i].setAddress(instructionQueue[instQueueIndex].getJ()); // set the address as the value is written in both registers
                    loadBuffer[i].setAsscInst(instructionQueue[instQueueIndex]);
                    loadBuffer[i].setTime(loadLatency);
                    instructionQueue[instQueueIndex].setIssue(cycle);
                    instructionQueue[instQueueIndex].setAsscbufferName(loadBuffer[i].getBufferName());
                    markRegFile(instructionQueue[instQueueIndex].getReturnReg(), loadBuffer[i].getBufferName());
                    break;
                }
            }
        }

        else if (instructionQueue[instQueueIndex].getInstruction() === 's.d') {
            // check if there is an empty store buffer
            for (let i = 0; i < storeBuffer.length; i++) {
                if (storeBuffer[i].getBusy() === 0) {
                    removeFromGlobalBuffer(storeBuffer[i].getBufferName());
                    storeBuffer[i].setBusy(1);  // set the buffer to busy
                    dependencies = checkDependencyStore(instructionQueue[instQueueIndex]);
                    if (dependencies != null) {
                        storeBuffer[i].setQ(dependencies); // set the address as the buffer is waiting for
                    }
                    else {
                        storeBuffer[i].setV(casualFetchValue(instructionQueue[instQueueIndex].getReturnReg())); // set the address as the value is written in both registers
                    }
                    if (storeBuffer[i].getV() != null) {
                        storeBuffer[i].setTime(storeLatency);
                    }
                    storeBuffer[i].setAddress(instructionQueue[instQueueIndex].getJ()); // set the address as the value is written in both registers
                    storeBuffer[i].setAsscInst(instructionQueue[instQueueIndex]);

                    instructionQueue[instQueueIndex].setIssue(cycle);
                    instructionQueue[instQueueIndex].setAsscbufferName(storeBuffer[i].getBufferName());
                    break;
                }
            }
        }

        else if (instructionQueue[instQueueIndex].getInstruction() === 'add.d') {
            // check if there is an empty ADD buffer
            for (let i = 0; i < addBuffer.length; i++) {
                if (addBuffer[i].getBusy() === 0) {
                    removeFromGlobalBuffer(addBuffer[i].getBufferName());
                    addBuffer[i].setBusy(1);  // set the buffer to busy
                    addBuffer[i].setOperation("ADD");
                    dependencies = checkDependencies(instructionQueue[instQueueIndex]);
                    console.log("addbuffer dependencies: " + dependencies);//----------------logging
                    if (dependencies[0] != null) {
                        addBuffer[i].setQj(dependencies[0]); // set Qj as the buffer it is waiting for
                    }
                    else {
                        addBuffer[i].setVj(casualFetchValue(instructionQueue[instQueueIndex].getJ())); // set vj as value in the regFile
                    }
                    if (dependencies[1] != null) {
                        addBuffer[i].setQk(dependencies[1]); // set Qk as the buffer it is waiting for
                    }
                    else {
                        addBuffer[i].setVk(casualFetchValue(instructionQueue[instQueueIndex].getK())); // set Vk as value in the regFile
                    }
                    if (addBuffer[i].getVj() != null && addBuffer[i].getVk() != null) {
                        addBuffer[i].setTime(addLatency);
                    }
                    addBuffer[i].setAsscInst(instructionQueue[instQueueIndex]);
                    instructionQueue[instQueueIndex].setIssue(cycle);
                    instructionQueue[instQueueIndex].setAsscbufferName(addBuffer[i].getBufferName());
                    markRegFile(instructionQueue[instQueueIndex].getReturnReg(), addBuffer[i].getBufferName());
                    break;
                }
            }
        }

        else if (instructionQueue[instQueueIndex].getInstruction() === 'sub.d') {
            // check if there is an empty ADD buffer
            for (let i = 0; i < addBuffer.length; i++) {
                if (addBuffer[i].getBusy() === 0) {
                    removeFromGlobalBuffer(addBuffer[i].getBufferName());
                    addBuffer[i].setBusy(1);  // set the buffer to busy
                    addBuffer[i].setOperation("SUB");
                    dependencies = checkDependencies(instructionQueue[instQueueIndex]);
                    console.log("addbuffer dependencies: " + dependencies);//----------------logging
                    if (dependencies[0] != null) {
                        addBuffer[i].setQj(dependencies[0]); // set Qj as the buffer it is waiting for
                    }
                    else {
                        addBuffer[i].setVj(casualFetchValue(instructionQueue[instQueueIndex].getJ())); // set vj as value in the regFile
                    }
                    if (dependencies[1] != null) {
                        addBuffer[i].setQk(dependencies[1]); // set Qk as the buffer it is waiting for
                    }
                    else {
                        addBuffer[i].setVk(casualFetchValue(instructionQueue[instQueueIndex].getK())); // set Vk as value in the regFile
                    }
                    if (addBuffer[i].getVj() != null && addBuffer[i].getVk() != null) {
                        addBuffer[i].setTime(subLatency);
                    }
                    addBuffer[i].setAsscInst(instructionQueue[instQueueIndex]);
                    instructionQueue[instQueueIndex].setIssue(cycle);
                    instructionQueue[instQueueIndex].setAsscbufferName(addBuffer[i].getBufferName());
                    markRegFile(instructionQueue[instQueueIndex].getReturnReg(), addBuffer[i].getBufferName());
                    break;
                }
            }
        }

        else if (instructionQueue[instQueueIndex].getInstruction() === 'mul.d') {
            // check if there is an empty MULT buffer
            for (let i = 0; i < multBuffer.length; i++) {
                if (multBuffer[i].getBusy() === 0) {
                    removeFromGlobalBuffer(multBuffer[i].getBufferName());
                    multBuffer[i].setBusy(1);  // set the buffer to busy
                    multBuffer[i].setOperation("MUL");
                    dependencies = checkDependencies(instructionQueue[instQueueIndex]);
                    console.log("multBuffer dependencies: " + dependencies);//----------------logging
                    if (dependencies[0] != null) {
                        multBuffer[i].setQj(dependencies[0]); // set Qj as the buffer it is waiting for
                    }
                    else {
                        multBuffer[i].setVj(casualFetchValue(instructionQueue[instQueueIndex].getJ())); // set vj as value in the regFile
                    }
                    if (dependencies[1] != null) {
                        multBuffer[i].setQk(dependencies[1]); // set Qk as the buffer it is waiting for
                    }
                    else {
                        multBuffer[i].setVk(casualFetchValue(instructionQueue[instQueueIndex].getK())); // set Vk as value in the regFile
                    }
                    if (multBuffer[i].getVj() != null && multBuffer[i].getVk() != null) {
                        multBuffer[i].setTime(multLatency);
                    }
                    multBuffer[i].setAsscInst(instructionQueue[instQueueIndex]);
                    instructionQueue[instQueueIndex].setIssue(cycle);
                    instructionQueue[instQueueIndex].setAsscbufferName(multBuffer[i].getBufferName());
                    markRegFile(instructionQueue[instQueueIndex].getReturnReg(), multBuffer[i].getBufferName());
                    break;
                }
            }
        }

        else if (instructionQueue[instQueueIndex].getInstruction() === 'div.d') {
            for (let i = 0; i < multBuffer.length; i++) {
                if (multBuffer[i].getBusy() === 0) {
                    removeFromGlobalBuffer(multBuffer[i].getBufferName());
                    multBuffer[i].setBusy(1);  // set the buffer to busy
                    multBuffer[i].setOperation("DIV");
                    dependencies = checkDependencies(instructionQueue[instQueueIndex]);
                    console.log("multBuffer dependencies: " + dependencies);//----------------logging
                    if (dependencies[0] != null) {
                        multBuffer[i].setQj(dependencies[0]); // set Qj as the buffer it is waiting for
                    }
                    else {
                        multBuffer[i].setVj(casualFetchValue(instructionQueue[instQueueIndex].getJ())); // set vj as value in the regFile
                    }
                    if (dependencies[1] != null) {
                        multBuffer[i].setQk(dependencies[1]); // set Qk as the buffer it is waiting for
                    }
                    else {
                        multBuffer[i].setVk(casualFetchValue(instructionQueue[instQueueIndex].getK())); // set Vk as value in the regFile
                    }
                    if (multBuffer[i].getVj() != null && multBuffer[i].getVk() != null) {
                        multBuffer[i].setTime(divLatency);
                    }
                    multBuffer[i].setAsscInst(instructionQueue[instQueueIndex]);
                    instructionQueue[instQueueIndex].setIssue(cycle);
                    instructionQueue[instQueueIndex].setAsscbufferName(multBuffer[i].getBufferName());
                    markRegFile(instructionQueue[instQueueIndex].getReturnReg(), multBuffer[i].getBufferName());
                    break;
                }
            }
        }
        // if all buffers are busy, then the instruction is not issued, thus we check for it again in the next cycle
        if (instructionQueue[instQueueIndex].getIssue() == null) {
            instQueueIndex--;
            console.log("ISSUING STALLED");
        }
        instQueueIndex++;
    }
    // clears the buffers that have written back
    checkBuffersToBeCleared();
    // checks all buffers to see if values pending can be fulfilled from write back
    checkWriteBack();
    cycle++;
}

const executeCycleTest = (e) => {
    e.preventDefault();
    console.log("CYCLE: " + (cycle) + "");
    executeNextCycle();
    console.log(loadBuffer);
    console.log(addBuffer);
    console.log(instructionQueue);
    console.log(regFile);
    console.log(globalBuffer);
    console.log("------------------------------------------------------------------");
}

// Cycles (Representation of clock cycles in frontend)
var x = 0;
const addx = (e) => {
    e.preventDefault();

    x++;
    console.log(x);
}

var stylingObject = {
    table: {
        "border": "1px solid black",
        "borderCollapse": "collapse"
    },
    th: {

        "border": "1px solid black",
        "paddingTop": "5px",
        "paddingBottom": "5px",
        "paddingLeft": "25px",
        "paddingRight": "25px"
    },
    td: {
        "borderCollapse": "collapse",
        "paddingTop": "5px",
        "paddingBottom": "5px",
        "paddingLeft": "25px",
        "paddingRight": "25px",
        "border": "1px solid black",

    }
}
var stylingObject2 = {
    tr: {
        "color": "#FFFFFF",
        "background": "#ff6700"
    }
}
var tableBody = {
    tr: {
        "backgroundColor": "#DFDBE5",
        "backgroundImage": "url(data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%239C92AC' fill-opacity='0.4' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E)"
    }
}
// create Load Buffer Table
const LoadBufferTable = ({ loadBuffer }) => {
    return (
        <div>
            <h3>Load Buffer</h3>
            <table style={stylingObject.table}>
                <thead>
                    <tr >
                        <th style={stylingObject.th}>Buffer Name</th>
                        <th style={stylingObject.th}>Busy</th>
                        <th style={stylingObject.th}>Address</th>
                        <th style={stylingObject.th}>Time</th>

                    </tr>
                </thead>
                <tbody>
                    {loadBuffer.map((buffer, index) => (
                        <tr key={index}>
                            <td style={stylingObject.td}> <b>{buffer.getBufferName()} </b></td>
                            <td style={stylingObject.td}>{buffer.getBusy()}</td>
                            <td style={stylingObject.td}>{buffer.getAddress()}</td>
                            <td style={stylingObject.td}>{buffer.getTime()}</td>

                        </tr>
                    ))}

                </tbody>
            </table>
        </div>
    )
}
// create Store Buffer Table
const StoreBufferTable = ({ storeBuffer }) => {
    return (
        <div style={{
            //"position": "relative",
            //"left": "500px",
            //"top": "-195px"

        }}>
            <h3>Store Buffer</h3>
            <table style={stylingObject.table}>
                <thead>
                    <tr>
                        <th style={stylingObject.th}>Buffer Name</th>
                        <th style={stylingObject.th}>Busy</th>
                        <th style={stylingObject.th}>Address</th>
                        <th style={stylingObject.th}>V</th>
                        <th style={stylingObject.th}>Q</th>
                        <th style={stylingObject.th}>Time</th>
                    </tr>
                </thead>
                <tbody>
                    {storeBuffer.map((buffer, index) => (
                        <tr key={index}>
                            <td style={stylingObject.td}> <b>{buffer.getBufferName()} </b></td>
                            <td style={stylingObject.td}>{buffer.getBusy()}</td>
                            <td style={stylingObject.td}>{buffer.getAddress()}</td>
                            <td style={stylingObject.td}>{buffer.getV()}</td>
                            <td style={stylingObject.td}>{buffer.getQ()}</td>
                            <td style={stylingObject.td}>{buffer.getTime()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
// create Instruction Queue table
const InstructionQueueTable = ({ instructionQueue }) => {
    return (
        <div>
            <h3>Instruction Queue</h3>
            <table style={stylingObject.table}>
                <thead>
                    <tr style={{
                        "color": "#FFFFFF",
                        "background": "#000000"
                    }} >
                        <th style={stylingObject.th}>Instruction</th>
                        <th style={stylingObject.th}>Return Register</th>
                        <th style={stylingObject.th}>J</th>
                        <th style={stylingObject.th}>K</th>
                        <th style={stylingObject.th}>Issue</th>
                        <th style={stylingObject.th}>Execute Start</th>
                        <th style={stylingObject.th}>Execute End</th>
                        <th style={stylingObject.th}>Write Back</th>
                        <th style={stylingObject.th}>Associated Buffer Name</th>
                    </tr>
                </thead>
                <tbody>
                    {instructionQueue.map((instruction, index) => (
                        <tr style={tableBody.tr} key={index}>
                            <td style={stylingObject.td}><b>{instruction.getInstruction()}</b></td>
                            <td style={stylingObject.td}>{instruction.getReturnReg()}</td>
                            <td style={stylingObject.td}>{instruction.getJ()}</td>
                            <td style={stylingObject.td}>{instruction.getK()}</td>
                            <td style={stylingObject.td}>{instruction.getIssue()}</td>
                            <td style={stylingObject.td}>{instruction.getExecutionStart()}</td>
                            <td style={stylingObject.td}>{instruction.getExecutionEnd()}</td>
                            <td style={stylingObject.td}>{instruction.getWriteResult()}</td>
                            <td style={stylingObject.td}>{instruction.getAsscbufferName()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
// create Add Buffer table
const AddBufferTable = ({ addBuffer }) => {
    return (
        <div>
            <h3>FP Adders</h3>
            <table style={stylingObject.table}>
                <thead>
                    <tr style={stylingObject2}>
                        <th style={stylingObject.th}>Buffer Name</th>
                        <th style={stylingObject.th}>Busy</th>
                        <th style={stylingObject.th}>Operation</th>
                        <th style={stylingObject.th}>Vj</th>
                        <th style={stylingObject.th}>Vk</th>
                        <th style={stylingObject.th}>Qj</th>
                        <th style={stylingObject.th}>Qk</th>
                        <th style={stylingObject.th}>Time</th>
                    </tr>
                </thead>
                <tbody>
                    {addBuffer.map((buffer, index) => (
                        <tr key={index}>
                            <td style={stylingObject.td}><b>{buffer.getBufferName()}</b></td>
                            <td style={stylingObject.td}>{buffer.getBusy()}</td>
                            <td style={stylingObject.td}>{buffer.getOperation()}</td>
                            <td style={stylingObject.td}>{buffer.getVj()}</td>
                            <td style={stylingObject.td}>{buffer.getVk()}</td>
                            <td style={stylingObject.td}>{buffer.getQj()}</td>
                            <td style={stylingObject.td}>{buffer.getQk()}</td>
                            <td style={stylingObject.td}>{buffer.getTime()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
// create mult Buffer table
const MultBufferTable = ({ multBuffer }) => {
    return (
        <div>
            <h3>FP Multipliers</h3>
            <table style={stylingObject.table}>
                <thead>
                    <tr style={stylingObject2}>
                        <th style={stylingObject.th}>Buffer Name</th>
                        <th style={stylingObject.th}>Busy</th>
                        <th style={stylingObject.th}>Operation</th>
                        <th style={stylingObject.th}>Vj</th>
                        <th style={stylingObject.th}>Vk</th>
                        <th style={stylingObject.th}>Qj</th>
                        <th style={stylingObject.th}>Qk</th>
                        <th style={stylingObject.th}>Time</th>
                    </tr>
                </thead>
                <tbody>
                    {multBuffer.map((buffer, index) => (
                        <tr key={index}>
                            <td style={stylingObject.td}><b>{buffer.getBufferName()}</b></td>
                            <td style={stylingObject.td}>{buffer.getBusy()}</td>
                            <td style={stylingObject.td}>{buffer.getOperation()}</td>
                            <td style={stylingObject.td}>{buffer.getVj()}</td>
                            <td style={stylingObject.td}>{buffer.getVk()}</td>
                            <td style={stylingObject.td}>{buffer.getQj()}</td>
                            <td style={stylingObject.td}>{buffer.getQk()}</td>
                            <td style={stylingObject.td}>{buffer.getTime()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
// create register File table
const RegFileTable = ({ regFile }) => {
    return (
        <div>
            <h3>Register File</h3>
            <table style={stylingObject.table}>
                <thead>
                    <tr>
                        <th style={stylingObject.th}>Register Name</th>
                        <th style={stylingObject.th}>Qi</th>
                        <th style={stylingObject.th}>Value</th>
                    </tr>
                </thead>
                <tbody>
                    {regFile.map((reg, index) => (
                        <tr key={index}>
                            <td style={stylingObject.td}>{reg.getRegName()}</td>
                            <td style={stylingObject.td}>{reg.getQi()}</td>
                            <td style={stylingObject.td}>{reg.getValue()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}




const App = () => {
    const [code, setCode] = React.useState('');
    const textRef = React.useRef();
    const [x2, setX] = React.useState(0);
    // var addBuffer = Array(4).fill(null).map(() => (new AddBuffer(0, null, null, null, null, null, null)))
    //  var loadBuffer = Array(4).fill(null).map(() => (new LoadBuffer(0, null, null)))
    // var multBuffer = Array(4).fill(null).map(() => (new MultBuffer(0, null, null, null, null, null, null)))
    // var storeBuffer = Array(4).fill(null).map(() => (new StoreBuffer(0, null, null, null, null, null, null)))
    //  var regFile = Array(10).fill(null).map(() => (new RegFile(null, 0)));
    // var globalBuffer = [];
    const [addBuffer2, setAddBuffer] = React.useState(Array(4).fill(null).map(() => (new AddBuffer(0, null, null, null, null, null, null))));
    const [loadBuffer2, setLoadBuffer] = React.useState(Array(3).fill(null).map(() => (new LoadBuffer(0, null, null))));
    const [multBuffer2, setMultBuffer] = React.useState(Array(4).fill(null).map(() => (new MultBuffer(0, null, null, null, null, null, null))));
    const [storeBuffer2, setStoreBuffer] = React.useState(Array(4).fill(null).map(() => (new StoreBuffer(0, null, null, null, null, null, null))));
    const [regFile2, setRegFile] = React.useState(Array(10).fill(null).map(() => (new RegFile(null, 0))));
    const [globalBuffer2, setGlobalBuffer] = React.useState('');
    const [instructionQueue2, setInstructionQueue] = React.useState([]);


    React.useEffect(() => {
        for (let i = 0; i < addBuffer.length; i++) {
            addBuffer[i].setBufferName("A" + (i + 1));
        }
        for (let i = 0; i < loadBuffer.length; i++) {
            loadBuffer[i].setBufferName("L" + (i + 1));
        }
        for (let i = 0; i < multBuffer.length; i++) {
            multBuffer[i].setBufferName("M" + (i + 1));
        }
        for (let i = 0; i < storeBuffer.length; i++) {
            storeBuffer[i].setBufferName("S" + (i + 1));
        }
        for (let i = 0; i < regFile.length; i++) {
            regFile[i].setRegName("F" + i);
            regFile[i].setValue(i);
        }
    }, [])

    return (
        <>
            <div>
                <h1 > Tomasulo Simulator </h1>
            </div>
            <div>
                <h2>Input mips Code in the black space below to begin:</h2>
                <CodeEditor
                    value={code}
                    ref={textRef}
                    language="mips"
                    placeholder="Please enter MIPS code."
                    onChange={(evn) => setCode(evn.target.value)}
                    padding={15}
                    style={{
                        fontFamily:
                            "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
                        fontSize: 12,
                        color: "#FFFFFF"
                    }}
                />

                <h4><button onClick={(e) => {
                    e.preventDefault();
                    loadInstruction(code);
                    setInstructionQueue(instructionQueue);
                    setLoadBuffer(loadBuffer);
                    setStoreBuffer(storeBuffer);
                    setAddBuffer(addBuffer);
                    setMultBuffer(multBuffer);
                    setRegFile(regFile);
                    setGlobalBuffer(globalBuffer);
                    x = 0;
                    setX(x);


                }}>load code</button></h4>



                <InstructionQueueTable instructionQueue={instructionQueue2} />
                <LoadBufferTable loadBuffer={loadBuffer2} />
                <StoreBufferTable storeBuffer={storeBuffer2} />
                <AddBufferTable addBuffer={addBuffer2} />
                <MultBufferTable multBuffer={multBuffer2} />
                <RegFileTable regFile={regFile2} />
                <h4><button onClick={(e) => {
                    e.preventDefault();
                    executeCycleTest(e);
                    setInstructionQueue(instructionQueue);
                    setLoadBuffer(loadBuffer);
                    setStoreBuffer(storeBuffer);
                    setAddBuffer(addBuffer);
                    setMultBuffer(multBuffer);
                    setRegFile(regFile);
                    setGlobalBuffer(globalBuffer);


                    addx(e)
                    setX(x);



                    //console.log("current add buffer:");
                    //console.log(addBuffer2);

                }}>Execute Next Cycle</button></h4>
                <b style={{ fontSize: 20 }}>{"Cycle: " + x2}</b>
            </div>
        </>

    )

}

export default App