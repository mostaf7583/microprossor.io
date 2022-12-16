class Instruction {
    constructor(name, resultReg, operand1, operand2) {
        this.type = name;
        this.resultReg = resultReg;
        this.operand1 = operand1;
        this.operand2 = operand2;
    }

    // Returns the instruction type
    getType() {
        return this.type;
    }
    // Returns the result register
    getResultReg() {
        return this.resultReg;
    }
    // Returns the first operand
    getOperand1() {
        return this.operand1;
    }
    // Returns the second operand
    getOperand2() {
        return this.operand2;
    }

    // sets the instruction type
    setType(name) {
        this.type = name;
    }
    // sets the result register
    setResultReg(resultReg) {
        this.resultReg = resultReg;
    }
    // sets the first operand
    setOperand1(operand1) {
        this.operand1 = operand1;
    }
    // sets the second operand
    setOperand2(operand2) {
        this.operand2 = operand2;
    }
}

export default Instruction;