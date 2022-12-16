class StoreBuffer {
    constructor(busy, Address, Q, V) {
        this.busy = busy;
        this.Address = Address;
        this.Q = Q;
        this.V = V;
    }
    // getters
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
    // setters
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
}

export default StoreBuffer;