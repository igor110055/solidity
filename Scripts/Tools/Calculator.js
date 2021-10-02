module.exports = class Calculator {
    calculateSimpleExtrema(aToken0Reserve, aToken1Reserve, aFee, bToken0Reserve, bToken1Reserve, bFee) {
        const a = aToken0Reserve
        const b = aToken1Reserve
        const c = aFee
        const d = bToken0Reserve
        const e = bToken1Reserve
        const f = bFee
        return (10000 * Math.sqrt(d) * Math.sqrt((a * b * c - 10000 * a * b) * e * f + (100000000 * a * b - 10000 * a * b * c) * e) - 100000000 * a * e) / ((b * c - 10000 * b) * f + (100000000 - 10000 * c) * e - 10000 * b * c + 100000000 * b)
    }

    calculateProfit(amountIn, aToken0Reserve, aToken1Reserve, aFee, bToken0Reserve, bToken1Reserve, bFee) {
        let amountInWithFee = amountIn * (10000 - aFee)
        let numerator = amountInWithFee * aToken1Reserve
        let denominator = aToken0Reserve * 10000 + amountInWithFee
        let afterSwapOne = numerator / denominator

        amountInWithFee = afterSwapOne * (10000 - bFee)
        numerator = amountInWithFee * bToken0Reserve
        denominator = bToken1Reserve * 10000 + amountInWithFee
        const output = ((numerator / denominator) - amountIn).toString()
        return output.split(".")[0]
    }

    calculateSimpleExtremaWithFee(aToken0Reserve, aToken1Reserve, aFee, bToken0Reserve, bToken1Reserve, bFee) {
        const a = aToken0Reserve
        const b = aToken1Reserve
        const c = aFee
        const d = bToken0Reserve
        const e = bToken1Reserve
        const f = bFee
        const extrema = (-100000000 * a * e + 9984.988733093 * Math.sqrt(a * b * c * d * e * f - 10000 * a * b * c * d * e - 10000 * a * b * d * e * f + 100000000 * a * b * d * e)) / (b * c * f - 10000 * b * c - 10000 * b * f + 100000000 * b - 10000 * c * e + 100000000 * e)
        return extrema.toString().split(".")[0]
    }
}