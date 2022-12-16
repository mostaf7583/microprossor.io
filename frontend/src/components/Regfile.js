class RegFile {
    constructor(regName, Qi, value) {
        this.regName = regName;
        this.Qi = Qi;
        this.value = value;
    }
    // setters
    setRegName(regName) {
        this.regName = regName;
    }
    setQi(Qi) {
        this.Qi = Qi;
    }
    setValue(value) {
        this.value = value;
    }
    // getters
    getRegName() {
        return this.regName;
    }
    getQi() {
        return this.Qi;
    }
    getValue() {
        return this.value;
    }
}

export default RegFile;