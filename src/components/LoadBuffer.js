class LoadBuffer {
    constructor(busy, Address, time) {
        this.bufferName = "L";
        this.busy = busy;
        this.Address = Address;
        this.time = time;
        this.AsscInst = null;
    }

    // setters

    setBufferName(bufferName) {
        this.bufferName = bufferName;
    }
    setBusy(busy) {
        this.busy = busy;
    }
    setAddress(Address) {
        this.Address = Address;
    }
    setTime(time) {
        this.time = time;
    }
    setAsscInst(AsscInst) {
        this.AsscInst = AsscInst;
    }
    // getters
    getBufferName() {
        return this.bufferName;
    }
    getBusy() {
        return this.busy;
    }
    getAddress() {
        return this.Address;
    }
    getTime() {
        return this.time;
    }
    getAsscInst() {
        return this.AsscInst;
    }
}

export default LoadBuffer;