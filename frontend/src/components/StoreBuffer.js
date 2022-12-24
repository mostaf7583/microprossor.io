class StoreBuffer {
    constructor(busy, Address, Q, V, time) {
        this.bufferName = "S";
        this.busy = busy;
        this.Address = Address;
        this.Q = Q;
        this.V = V;
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
    getAddress() {
        return this.Address;
    }
    getQ() {
        return this.Q;
    }
    getV() {
        return this.V;
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
    setAddress(Address) {
        this.Address = Address;
    }
    setQ(Q) {
        this.Q = Q;
    }
    setV(V) {
        this.V = V;
    }
    setTime(time) {
        this.time = time;
    }
    setAsscInst(AsscInst) {
        this.AsscInst = AsscInst;
    }


}

export default StoreBuffer;