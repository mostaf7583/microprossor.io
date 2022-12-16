class LoadBuffer {
    constructor(busy, Address) {
        this.busy = busy;
        this.Address = Address;
    }
    // setters
    setBusy(busy) {
        this.busy = busy;
    }
    setAddress(Address) {
        this.Address = Address;
    }
    // getters
    getBusy() {
        return this.busy;
    }
    getAddress() {
        return this.Address;
    }
}

export default LoadBuffer;