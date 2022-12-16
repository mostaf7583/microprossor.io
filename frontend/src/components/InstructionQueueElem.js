class InstructionQueueElem {
    constructor(instruction, returnReg, j, k, issue, executionStart, executionEnd, writeResult) {
        this.instruction = instruction;
        this.returnReg = returnReg;
        this.j = j;
        this.k = k;
        this.issue = issue;
        this.executionStart = executionStart;
        this.executionEnd = executionEnd;
        this.writeResult = writeResult;
    }

    // setters
    setInstruction(instruction) {
        this.instruction = instruction;
    }
    setReturnReg(returnReg) {
        this.returnReg = returnReg;
    }
    setJ(j) {
        this.j = j;
    }
    setK(k) {
        this.k = k;
    }
    setIssue(issue) {
        this.issue = issue;
    }
    setExecutionStart(executionStart) {
        this.executionStart = executionStart;
    }
    setExecutionEnd(executionEnd) {
        this.executionEnd = executionEnd;
    }
    setWriteResult(writeResult) {
        this.writeResult = writeResult;
    }

    // getters
    getInstruction() {
        return this.instruction;
    }
    getReturnReg() {
        return this.returnReg;
    }
    getJ() {
        return this.j;
    }
    getK() {
        return this.k;
    }
    getIssue() {
        return this.issue;
    }
    getExecutionStart() {
        return this.executionStart;
    }
    getExecutionEnd() {
        return this.executionEnd;
    }
    getWriteResult() {
        return this.writeResult;
    }
}

export default InstructionQueueElem;