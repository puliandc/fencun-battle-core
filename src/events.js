/**
 * 游戏事件类型定义
 * 用于逻辑层与渲染层的解耦
 */

/**
 * 事件类型枚举
 */
export const EventType = {
    // ============================================
    // 战斗流程事件
    // ============================================

    /** 攻击开始 */
    ATTACK_START: 'ATTACK_START',
    /** 攻击命中 */
    ATTACK_SUCCESS: 'ATTACK_SUCCESS',
    /** 攻击未命中 */
    ATTACK_MISS: 'ATTACK_MISS',
    /** 造成伤害 */
    DAMAGE_DEALT: 'DAMAGE_DEALT',
    /** 单位受伤 */
    UNIT_WOUNDED: 'UNIT_WOUNDED',
    /** 单位阵亡 */
    UNIT_DEFEATED: 'UNIT_DEFEATED',

    // ============================================
    // 技能效果事件
    // ============================================

    /** 技能触发 */
    SKILL_TRIGGERED: 'SKILL_TRIGGERED',
    /** 增益效果应用 */
    BUFF_APPLIED: 'BUFF_APPLIED',
    /** 嘲讽效果应用 */
    TAUNT_APPLIED: 'TAUNT_APPLIED',
    /** 护盾使用（铁甲护身） */
    SHIELD_USED: 'SHIELD_USED',
    /** 连招触发 */
    COMBO_TRIGGERED: 'COMBO_TRIGGERED',

    // ============================================
    // 内力系统事件
    // ============================================

    /** 内力牌弃置 */
    QI_CARD_DISCARDED: 'QI_CARD_DISCARDED',
    /** 内力牌回收 */
    QI_CARD_RECYCLED: 'QI_CARD_RECYCLED',
    /** 内力枯竭 */
    QI_EXHAUSTED: 'QI_EXHAUSTED',
    /** 调息（重新发牌） */
    RELOAD_TRIGGERED: 'RELOAD_TRIGGERED',

    // ============================================
    // 回合流程事件
    // ============================================

    /** 回合切换 */
    TURN_CHANGE: 'TURN_CHANGE',
    /** AI 回合开始 */
    AI_TURN: 'AI_TURN',
    /** 局结束 */
    ROUND_END: 'ROUND_END',
    /** 比赛结束 */
    MATCH_END: 'MATCH_END',
    /** 下一局重置 */
    ROUND_RESET: 'ROUND_RESET',
    /** 下一局开始 */
    ROUND_START: 'ROUND_START',

    // ============================================
    // UI 提示事件
    // ============================================

    /** 浮动消息 */
    FLOATING_MESSAGE: 'FLOATING_MESSAGE',
    /** 攻击结果提示 */
    SHOT_RESULT: 'SHOT_RESULT',
    /** 目标震动效果 */
    SHAKE_TARGET: 'SHAKE_TARGET',
    /** 日志消息 */
    LOG_MESSAGE: 'LOG_MESSAGE',
    /** 局间总结 */
    ROUND_SUMMARY: 'ROUND_SUMMARY',

    // ============================================
    // 阻塞事件（需要玩家输入）
    // ============================================

    /** 待处理行动（如阵亡卡去向选择） */
    PENDING_ACTION: 'PENDING_ACTION',
};

/**
 * 创建事件对象
 * @param {string} type - 事件类型 (EventType)
 * @param {Object} payload - 事件数据
 * @param {number} [sequence] - 事件序号（可选，由 EventCollector 自动填充）
 * @returns {Object} 事件对象
 */
export const createEvent = (type, payload = {}, sequence = 0) => ({
    type,
    sequence,
    payload,
});

/**
 * 事件收集器
 * 用于在逻辑执行过程中收集事件
 */
export class EventCollector {
    constructor() {
        this.events = [];
        this.sequence = 0;
    }

    /**
     * 发送事件
     * @param {string} type - 事件类型
     * @param {Object} payload - 事件数据
     */
    emit(type, payload = {}) {
        this.events.push(createEvent(type, payload, this.sequence++));
    }

    /**
     * 获取所有收集的事件
     * @returns {Array} 事件数组
     */
    getEvents() {
        return [...this.events];
    }

    /**
     * 清空事件
     */
    clear() {
        this.events = [];
        this.sequence = 0;
    }

    /**
     * 获取事件数量
     * @returns {number}
     */
    get length() {
        return this.events.length;
    }
}

/**
 * 创建事件收集器
 * @returns {EventCollector}
 */
export const createEventCollector = () => new EventCollector();
