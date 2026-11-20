/**
 * 随机数工具模块
 * 提供可测试的随机数生成器，支持依赖注入
 */

/**
 * 创建可预测的种子随机数生成器 (用于测试)
 * 使用线性同余生成器 (LCG) 算法
 * @param {number} seed 种子值
 * @returns {function} rng 函数，返回 [0, 1) 的伪随机数
 */
export const createSeededRng = (seed) => {
    let s = seed;
    return () => {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        return s / 0x7fffffff;
    };
};

/**
 * 默认随机源，生产环境使用
 * @returns {number} [0, 1) 的随机数
 */
export const defaultRng = () => Math.random();

/**
 * 使用随机源从数组中随机选择一个元素
 * @param {Array} array 源数组
 * @param {function} rng 随机数生成器
 * @returns {*} 随机选中的元素
 */
export const pickRandom = (array, rng = defaultRng) => {
    if (!array || array.length === 0) return undefined;
    return array[Math.floor(rng() * array.length)];
};

/**
 * 使用随机源对数组进行洗牌 (Fisher-Yates)
 * @param {Array} array 源数组（不会被修改）
 * @param {function} rng 随机数生成器
 * @returns {Array} 洗牌后的新数组
 */
export const shuffleArray = (array, rng = defaultRng) => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rng() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
};
