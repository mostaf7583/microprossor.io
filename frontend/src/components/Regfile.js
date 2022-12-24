
class RegFile {
    constructor(Qi, value) {

        this.regName = "F";
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
        return this.regName.toLowerCase();
    }
    getQi() {
        return this.Qi;
    }
    getValue() {
        return this.value;
    }
}

export default RegFile;