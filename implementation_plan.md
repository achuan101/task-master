# 估值模型动态路由 v1.1.0 最终实施方案 (代码落地)

本方案明确了如何将最新的 `route.v1.1.0` 逻辑与现有的 `valuation_router/` Python 代码库对齐，特别是针对缺失的“护城河”数据采用**“量化代理 + 白名单混合法”**的落地策略。

## 核心数据源搭桥方案 (Bridging Data Gaps)

针对当前数据源缺乏 Morningstar 结构化护城河评级的问题，我们采用纯本地代码实现的混合策略：
1. **护城河量化倒推算法 (Quantitative Moat Proxy)**：在 `features.py` 中增加函数，基于财务特征判断。
   * `wide` (宽)：近 3 年平均 ROE > 15% 且 毛利率处于行业前列 且 OCF 稳定为正。
   * `narrow` (窄)：近 3 年 ROE > 10% 且 盈利不亏损。
   * `none` (无)：亏损、高负债、强周期重资产或极微利企业。
2. **绝对白名单覆盖 (Whitelist Override)**：在配置库中引入一个可人工维护的硬编码集合（如 Kweichow Moutai、Tencent 等），如果股票代码在集合中，强制赋予 `wide`。

## User Review Required

我们将改动现有的核心路由引擎文件（`engine.py`, `features.py`, `models.py` 等）。
**关键确认项**：您是否同意在代码中先采用上述的“量化倒推 + 白名单”作为 `economic_moat` 的特征提取方案？（后期如果有条件接入大模型批处理或外部 API，只需重构 `features.py` 里的这一个函数即可，不影响整体引擎架构）。

## Proposed Changes

我们将对 `valuation_router/` 下的 5 个核心模块进行修改。

### 1. 数据模型与接口重构
#### [MODIFY] `valuation_router/models.py`
- 在 `RouteDecision` 模型（或对应的数据字典/dataclass）中新增 `economic_moat: str` 和 `recommended_safety_margin: float` 字段。
- 在 `RelativeMetric` 枚举中新增 `EV_FCF` 和 `P_FCF`。
- 在 `FinancialFeatures` 模型中新增布尔值字段：`fundamental_crash`, `high_goodwill`。

### 2. 配置项扩充
#### [MODIFY] `valuation_router/config.py`
- 新增 `moat_discount_adj: float = -0.01` (宽护城河 WACC 下调)。
- 新增 `margin_crash_threshold: float = -0.50`。
- 新增 `goodwill_asset_ratio: float = 0.20` 和 `goodwill_equity_ratio: float = 0.50`。
- 新增安全边际配置：`safety_margin_wide: float = 0.20`, `safety_margin_general: float = 0.35`, `safety_margin_risk: float = 0.60`。
- 新增滞回相关：`hysteresis_max_qs: int = 3`。

### 3. 特征提取引擎
#### [MODIFY] `valuation_router/features.py`
- **新增 `_extract_moat` 函数**：实现前述的量化代理+白名单判定逻辑，输出 `wide`, `narrow`, `none`。
- **强化 `earnings_quality_fail`**：加入对 OCF（经营性现金流）的检查。
- **新增 `_check_fundamental_crash`**：比对当前期与同期的毛利率、营收变动，识别断崖式下跌。
- **新增 `_check_goodwill`**：比对商誉/总资产和商誉/净资产比例，判定 `high_goodwill`。
- 完善 `asset_light` 判定，剥离金融与地产后的轻资产企业。

### 4. 审计与原因码
#### [MODIFY] `valuation_router/reason_codes.py`
- 新增新的排雷与穿透原因码：`FIN.HIGH_GOODWILL.FORBID_PB`, `IND.ASSET_LIGHT.FORBID_PB`, `HYSTERESIS.BROKEN.CRASH`, `HYSTERESIS.BROKEN.TIMEOUT`, `MOAT.WIDE.CONFIDENCE_UP` 等。

### 5. 核心路由与降级链条（引擎本体）
#### [MODIFY] `valuation_router/engine.py`
- **有效性禁区 (Forbidden Rules)**：
  - 加入对轻资产服务的 `PB` 禁用。
  - 加入 `high_goodwill` 对普通 `PB` 的禁用（强制 `PB_TBV`）。
- **主降级链条 (Primary Chain)**：
  - 针对成熟高质企业，链条头部插入 `EV_FCF`。
  - 修改互联网、亏损等链条，截断至 `EV_SALES`。
- **绝对估值智能挂载与调参**：
  - 解除对金融股的限制，允许金融企业正常挂载 `DDM` / `RIM`。
  - 接入 `economic_moat` 因子，若为 `wide`，调整返回对象的 DCF/WACC 预期参数。
- **滞回控制器 (Hysteresis Controller)**：
  - 增加阻断逻辑判断：如果触发 `fundamental_crash`，立刻放弃滞回。
- **安全边际生成器**：
  - 在生成最终 `RouteDecision` 对象前，注入 `recommended_safety_margin` 逻辑（20% / 30~40% / 60% 三档）。

## Verification Plan

### Automated Tests
- 编写/修改 `tests/test_engine.py` 或针对各主要分支补充单元测试：
  - `test_moat_derived_from_roe()`: 验证高 ROE 企业被划分为 wide。
  - `test_high_goodwill_forbids_pb()`: 验证高商誉公司输出禁区包含 PB。
  - `test_fundamental_crash_breaks_hysteresis()`: 验证利润暴跌企业不再保持上一期的市盈率倍数。

### Manual Verification
- 手动构建一份测试用 JSON (包含高商誉、利润暴跌、以及符合 wide moat 资质的样本财务事实)。
- 将测试事实注入引擎，验证输出的 `primary` 和 `reason_codes` 是否完全符合 V1.1.0 标准。
