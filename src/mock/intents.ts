import type { Intent } from '@/types';

// 30+ 条意图规则库：关键词匹配 -> 意图 + 话术 + 示例问法
export const INTENTS: Intent[] = [
  {
    id: 'i01', name: '问候打招呼', code: 'greet', group: '基础闲聊', status: 'enabled',
    keywords: ['你好', '您好', 'hi', 'hello', '在吗'],
    examples: ['你好，在吗？', '您好，我想咨询个问题', 'hi'],
    answers: [
      '您好！我是小智智能助手，很高兴为您服务。请问有什么可以帮您？',
      '您好呀～我是小智，产品咨询、售后问题、账单查询都可以找我，请讲～',
    ],
  },
  {
    id: 'i02', name: '产品咨询', code: 'product_consult', group: '产品', status: 'enabled',
    keywords: ['产品', '功能', '怎么样', '介绍', '有什么用', '智能客服', '语音助手'],
    examples: ['你们的智能客服产品都有哪些功能？', '语音助手怎么用，给我介绍一下', '语义引擎产品怎么样'],
    answers: [
      '我们旗舰产品「智能交互与理解平台」包含多轮对话、语义理解、语音交互、知识库四大能力，支持私有化部署。您想深入了解哪个模块呢？',
      '我们的语义引擎支持意图识别、实体抽取、情感分析，识别准确率在实测中达到 92% 以上，并可与您现有客服系统快速对接。',
    ],
  },
  {
    id: 'i03', name: '价格咨询', code: 'price_consult', group: '产品', status: 'enabled',
    keywords: ['价格', '多少钱', '收费', '套餐', '报价', '费用'],
    examples: ['你们这个平台多少钱一年？', '企业版套餐价格是多少', '收费方式是怎样的'],
    answers: [
      '我们提供三种套餐：标准版 3.98 万/年（10 席位）、专业版 8.8 万/年（50 席位）、旗舰版定制报价。目前采购年度套餐可享 8 折优惠，需要我安排商务跟您对接吗？',
    ],
  },
  {
    id: 'i04', name: '退款申请', code: 'refund', group: '售后', status: 'enabled',
    keywords: ['退款', '退钱', '退款流程', '什么时候退'],
    examples: ['我要申请退款，怎么操作', '退款什么时候到账', '昨天付的钱能退吗'],
    answers: [
      '退款可在「个人中心-订单管理」中发起，审核通过后 1-3 个工作日原路退回。如遇支付渠道延迟，最迟不超过 7 个工作日。请问您需要退哪笔订单？',
    ],
  },
  {
    id: 'i05', name: '退货换货', code: 'exchange', group: '售后', status: 'enabled',
    keywords: ['退货', '换货', '质量', '坏', '破损'],
    examples: ['收到的设备有破损，想换货', '硬件坏了能退货吗'],
    answers: [
      '商品签收 7 日内支持无理由退换，质量问题 15 日内免费换新。请在「售后中心」提交工单并上传照片，我们会安排顺丰上门取件，全程免运费。',
    ],
  },
  {
    id: 'i06', name: '账单查询', code: 'bill_query', group: '账务', status: 'enabled',
    keywords: ['账单', '扣款', '扣费', '消费记录', '扣了多少钱'],
    examples: ['帮我查一下这个月的账单', '为什么扣了我 299 元', '哪里能看到消费记录'],
    answers: [
      '您可以在「控制台-费用中心」查看全部账单明细，支持按月导出。若对某笔扣款有疑问，请提供订单号，我帮您逐笔核对。',
    ],
  },
  {
    id: 'i07', name: '发票开具', code: 'invoice', group: '账务', status: 'enabled',
    keywords: ['发票', '开票', '专票', '普票'],
    examples: ['怎么开增值税发票', '发票抬头填错了能改吗', '专票多久能开出来'],
    answers: [
      '电子普票在支付成功后自动开具，增值税专票请在「费用中心-发票管理」提交抬头信息，1 个工作日内开出。发票抬头开错 90 天内支持红冲重开。',
    ],
  },
  {
    id: 'i08', name: '会员活动', code: 'member_activity', group: '活动', status: 'enabled',
    keywords: ['会员', '活动', '优惠', '折扣', '优惠券', '活动价'],
    examples: ['最近有什么优惠活动吗', '会员日是什么时候', '优惠券怎么领'],
    answers: [
      '本月「双 11 技术狂欢季」进行中：新购平台产品满 1 万减 1200，老客户续费享 85 折。优惠券可在「会员中心-优惠券」领取，有效期至本月底。',
    ],
  },
  {
    id: 'i09', name: '积分查询', code: 'points_query', group: '账务', status: 'enabled',
    keywords: ['积分', '兑换', '积分商城'],
    examples: ['我的积分还有多少', '积分能兑换什么'],
    answers: [
      '积分可在「会员中心」查看，当前每消费 1 元累计 1 积分，500 积分起可在积分商城兑换周边礼品或抵扣服务费。',
    ],
  },
  {
    id: 'i10', name: '物流查询', code: 'logistics', group: '服务', status: 'enabled',
    keywords: ['物流', '快递', '发货', '到货', '什么时候到'],
    examples: ['我的设备什么时候发货', '快递单号怎么查'],
    answers: [
      '订单发货后会在「订单详情」展示顺丰运单号，江浙沪次日达、全国 2-4 天。请提供订单号，我帮您查询最新物流轨迹。',
    ],
  },
  {
    id: 'i11', name: '订单查询', code: 'order_query', group: '服务', status: 'enabled',
    keywords: ['订单', '下单', '我的订单', '订单号'],
    examples: ['帮我查下订单 SD2026110301', '我的订单状态是什么'],
    answers: [
      '请提供订单号（格式如 SD 开头 + 数字），我帮您查询订单状态、支付情况与交付进度。',
    ],
  },
  {
    id: 'i12', name: '修改订单', code: 'modify_order', group: '服务', status: 'enabled',
    keywords: ['修改订单', '改地址', '取消订单', '换规格'],
    examples: ['我想修改收货地址', '订单还没发货能取消吗'],
    answers: [
      '未发货订单支持自助修改收货地址与规格；已发货订单可拒收后自动退回重下。取消订单请在「订单详情」点击「申请取消」，审核约 2 小时。',
    ],
  },
  {
    id: 'i13', name: '技术支持', code: 'tech_support', group: '技术', status: 'enabled',
    keywords: ['报错', 'bug', '故障', '闪退', '无法登录', '崩溃', '异常'],
    examples: ['系统一直报错 500', '客户端总是闪退怎么办', '接口调用返回异常'],
    answers: [
      '抱歉给您带来不便！请提供报错截图与发生时间，技术支持团队会 30 分钟内响应。紧急故障可拨打 400-880-9166 转 2 进入专属技术通道。',
    ],
  },
  {
    id: 'i14', name: '密码重置', code: 'password_reset', group: '技术', status: 'enabled',
    keywords: ['密码', '忘记密码', '验证码', '登录不上'],
    examples: ['忘记密码了怎么找回', '收不到验证码'],
    answers: [
      '点击登录页「忘记密码」，通过绑定手机验证后即可重置。若收不到短信验证码，请检查骚扰拦截，或联系管理员在后台为您重置。',
    ],
  },
  {
    id: 'i15', name: '账号注销', code: 'account_cancel', group: '账号', status: 'enabled',
    keywords: ['注销', '删除账号', '不用了'],
    examples: ['我想把账号注销掉', '怎么删除我的账号'],
    answers: [
      '账号注销请在「设置-账号安全」发起，需管理员二次确认。注销后 15 天冷静期内可撤销，之后数据将不可恢复，请谨慎操作。',
    ],
  },
  {
    id: 'i16', name: '投诉建议', code: 'complaint', group: '风险', status: 'enabled',
    keywords: ['投诉', '举报', '差评', '不满', '态度'],
    examples: ['我要投诉你们的客服', '对处理结果很不满意'],
    answers: [
      '非常抱歉给您带来了不好的体验！您的问题我已记录并升级至客服主管，主管会在 2 小时内专门跟进处理。也欢迎提出改进建议，我们认真对待每一条反馈。',
    ],
  },
  {
    id: 'i17', name: '转人工', code: 'human_transfer', group: '服务', status: 'enabled',
    keywords: ['人工', '真人', '客服', '转接'],
    examples: ['我要转人工客服', '让真人来跟我说'],
    answers: [
      '好的，正在为您转接人工客服～当前排队约 1 人，预计等待 30 秒。工作时间为 9:00-21:00，请您稍候。',
    ],
  },
  {
    id: 'i18', name: '营业时间', code: 'business_hours', group: '咨询', status: 'enabled',
    keywords: ['营业时间', '几点上班', '工作时间', '节假日'],
    examples: ['你们几点上班', '周末有人吗'],
    answers: ['人工客服工作时间：周一至周六 9:00-21:00，周日 10:00-18:00（法定节假日除外）。机器人助手 7×24 小时在线。'],
  },
  {
    id: 'i19', name: '联系方式', code: 'contact', group: '咨询', status: 'enabled',
    keywords: ['电话', '联系方式', '地址', '邮箱'],
    examples: ['你们的联系电话是多少', '公司地址在哪'],
    answers: ['服务热线 400-880-9166，商务合作 business@iiup-tech.com。公司地址：北京市海淀区中关村软件园二期智汇大厦 B 座 15 层。'],
  },
  {
    id: 'i20', name: '意见反馈', code: 'feedback', group: '服务', status: 'enabled',
    keywords: ['反馈', '建议', '意见', '功能需求'],
    examples: ['我有个功能建议', '希望增加批量导入功能'],
    answers: ['感谢您的建议！产品团队每周汇总用户反馈评估排期，被采纳的建议会在「公告」中公示并赠送积分奖励。'],
  },
  {
    id: 'i21', name: '合同签署', code: 'contract', group: '商务', status: 'enabled',
    keywords: ['合同', '签约', '盖章', '电子签'],
    examples: ['合同什么时候能寄过来', '支持电子签章吗'],
    answers: ['支持电子签章（e签宝），也可线下盖章寄送。合同流程：报价确认 → 法务审核（1 天）→ 签署归档。需要法务加急请备注。'],
  },
  {
    id: 'i22', name: '合作洽谈', code: 'cooperation', group: '商务', status: 'enabled',
    keywords: ['合作', '代理', '商务', '渠道', 'OEM'],
    examples: ['我想做你们区域的代理商', '有 OEM 合作模式吗'],
    answers: [
      '我们提供区域代理、OEM 贴牌、技术集成三种合作模式，代理商享有首年 30% 分润。请留下您的公司名称与联系方式，商务经理 1 个工作日内联系您。',
    ],
  },
  {
    id: 'i23', name: '数据导出', code: 'data_export', group: '产品', status: 'enabled',
    keywords: ['导出', '下载报表', '下载', 'excel'],
    examples: ['对话记录能导出 excel 吗', '报表怎么下载'],
    answers: ['对话记录、质检结果、运营报表均支持一键导出 Excel/CSV，入口在各模块右上角「导出」按钮。大屏数据支持定时邮件推送。'],
  },
  {
    id: 'i24', name: '软件更新', code: 'update', group: '产品', status: 'enabled',
    keywords: ['更新', '升级', '新版本', '迭代'],
    examples: ['最近有什么新版本', '怎么升级到最新版'],
    answers: ['当前最新版本 v2.3.1（本月发布），新增语音情感识别与多语言意图支持。私有化部署客户可在控制台「版本管理」一键灰度升级。'],
  },
  {
    id: 'i25', name: '安全隐私', code: 'privacy', group: '风险', status: 'enabled',
    keywords: ['隐私', '数据安全', '泄露', '加密', '合规'],
    examples: ['你们的数据安全怎么保障', '对话数据会泄露吗'],
    answers: ['平台通过 ISO 27001 与等保三级认证，全链路 TLS 加密传输、存储 AES-256 加密，支持私有化部署实现数据不出域。审计日志保留 180 天。'],
  },
  {
    id: 'i26', name: '续费问题', code: 'renew', group: '账务', status: 'enabled',
    keywords: ['续费', '到期', '过期', '快到期'],
    examples: ['我的服务快到期了怎么续费', '续费有优惠吗'],
    answers: ['服务到期前 15 天会短信提醒。续费享 85 折起优惠，续费时长越长折扣越大。您也可以开通自动续费，避免服务中断。'],
  },
  {
    id: 'i27', name: '权限管理', code: 'permission', group: '产品', status: 'enabled',
    keywords: ['权限', '管理员', '子账号', '角色'],
    examples: ['怎么给同事开通子账号', '权限怎么配置'],
    answers: ['管理员可在「系统管理-用户管理」添加子账号并分配角色（坐席/知识管理员/分析员），权限粒度到菜单与按钮级别。'],
  },
  {
    id: 'i28', name: '接口对接', code: 'api', group: '技术', status: 'enabled',
    keywords: ['接口', 'api', '对接', '文档', 'sdk'],
    examples: ['有 API 文档吗', '怎么和我们的 CRM 对接'],
    answers: ['开放平台提供 RESTful API 与 WebSocket 两种接入方式，附带 Java/Python/Go SDK。完整文档见 docs.iiup-tech.com，沙箱环境免费试用 30 天。'],
  },
  {
    id: 'i29', name: '催促发货', code: 'urge_delivery', group: '服务', status: 'enabled',
    keywords: ['催', '还没发', '太慢', '等多久'],
    examples: ['都三天了还没发货，太慢了', '能催一下发货吗'],
    answers: ['非常理解您的心情！我已为您标记加急，仓库会在今日 18:00 前优先处理您的订单，发货后第一时间短信通知您运单号。'],
  },
  {
    id: 'i30', name: '感谢告别', code: 'thanks', group: '基础闲聊', status: 'enabled',
    keywords: ['谢谢', '感谢', '再见', '拜拜', 'ok', '好的'],
    examples: ['好的谢谢了', '再见'],
    answers: ['不客气，很高兴帮到您！后续有任何问题随时找我，祝您工作顺利，再见～'],
  },
];

export const INTENT_BY_CODE = Object.fromEntries(INTENTS.map((i) => [i.code, i]));
