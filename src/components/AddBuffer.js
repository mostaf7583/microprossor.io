class AddBuffer {
    constructor(busy, operation, Vj, Vk, Qj, Qk, time) {
        this.bufferName = "A";
        this.busy = busy;
        this.operation = operation;
        this.Vj = Vj;
        this.Vk = Vk;
        this.Qj = Qj;
        this.Qk = Qk;
        this.time = time;
        this.AsscInst = null;
    }
    // getters
    getBufferName() {
        return this.bufferName;
    }
    getBusy() {
        return this.busy;
    }
    getOperation() {
        return this.operation;
    }
    getVj() {
        return this.Vj;
    }
    getVk() {
        return this.Vk;
    }
    getQj() {
        return this.Qj;
    }
    getQk() {
        return this.Qk;
    }
    getTime() {
        return this.time;
    }
    getAsscInst() {
        return this.AsscInst;
    }
    // setters
    setBufferName(bufferName) {
        this.bufferName = bufferName;
    }
    setBusy(busy) {
        this.busy = busy;
    }
    setOperation(operation) {
        this.operation = operation;
    }
    setVj(Vj) {
        this.Vj = Vj;
    }
    setVk(Vk) {
        this.Vk = Vk;
    }
    setQj(Qj) {
        this.Qj = Qj;
    }
    setQk(Qk) {
        this.Qk = Qk;
    }
    setTime(time) {
        this.time = time;
    }
    setAsscInst(AsscInst) {
        this.AsscInst = AsscInst;
    }
}

export default AddBuffer;