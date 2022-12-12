class AddBuffer {
    constructor(busy, operation, Vj, Vk, Qj, Qk) {
        this.busy = busy;
        this.operation = operation;
        this.Vj = Vj;
        this.Vk = Vk;
        this.Qj = Qj;
        this.Qk = Qk;
    }
    // getters
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
    // setters
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
}