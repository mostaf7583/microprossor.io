class GobalBuffer {
    constructor(bufferName, result) {
        this.bufferName = bufferName;
        this.result = result;
    }
    // getters
    getBufferName() {
        return this.bufferName;
    }
    getResult() {
        return this.result;
    }

    // setters
    setBufferName(bufferName) {
        this.bufferName = bufferName;
    }
    setResult(result) {
        this.result = result;
    }

}

export default GobalBuffer;