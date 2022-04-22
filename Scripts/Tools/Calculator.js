/**
 * @type {Calculator}
 */
class Calculator {
    /**
     * @param loan
     * @returns {string}
     */
    static calculateFlashSwapFee = loan => {
        return (((loan * 3) / 997) + 1).toString().split(".")[0]
    }

    /**
     * @param aToken0Reserve
     * @param aToken1Reserve
     * @param aFee
     * @param bToken0Reserve
     * @param bToken1Reserve
     * @param bFee
     * @returns {string}
     */
    calculateSimpleExtrema(aToken0Reserve, aToken1Reserve, aFee, bToken0Reserve, bToken1Reserve, bFee) {
        const a = aToken0Reserve
        const b = aToken1Reserve
        const c = aFee
        const d = bToken0Reserve
        const e = bToken1Reserve
        const f = bFee
        const output = (10000 * Math.sqrt(d) * Math.sqrt((a * b * c - 10000 * a * b) * e * f + (100000000 * a * b - 10000 * a * b * c) * e) - 100000000 * a * e) / ((b * c - 10000 * b) * f + (100000000 - 10000 * c) * e - 10000 * b * c + 100000000 * b)
        return output.toString().split(".")[0]
    }

    /**
     * @param amountIn
     * @param aToken0Reserve
     * @param aToken1Reserve
     * @param aFee
     * @param bToken0Reserve
     * @param bToken1Reserve
     * @param bFee
     * @returns {string}
     */
    calculateProfit(amountIn, aToken0Reserve, aToken1Reserve, aFee, bToken0Reserve, bToken1Reserve, bFee) {
        let amountInWithFee = amountIn * (10000 - aFee)
        let numerator = amountInWithFee * aToken1Reserve
        let denominator = aToken0Reserve * 10000 + amountInWithFee
        let afterSwapOne = numerator / denominator

        amountInWithFee = afterSwapOne * (10000 - bFee)
        numerator = amountInWithFee * bToken0Reserve
        denominator = bToken1Reserve * 10000 + amountInWithFee
        const output = ((numerator / denominator) - amountIn)
        const flashSwapFee = Calculator.calculateFlashSwapFee(amountIn)
        return (output - flashSwapFee).toString().split(".")[0]
    }
}

module.exports = Calculator