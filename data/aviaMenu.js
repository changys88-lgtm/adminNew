const HIDE_MENU = true;

const menuJson = {
    "상품관리;fa-chart-area" : [
        ["상품관리"		,"GOODS"	,"/Goods/Goods_list"        ,"Y"],
        ["재고관리"		,"STOCK"	,"/Goods/Stocks"            ,""],
        ["재고관리2"		,"STOCK2"	,"/Goods/Stock_list"        ,"N"],
        ["골프관리"		,"GOLFTEE"	,"/Golflist/golf_list"      ,"N" ],
        ["상품승인"		,"GOODSAUTH"	,"/Goods/Goods_confirm_list","N"]
    ],
    "예약관리;fa-book": [
        ["예약목록"		   ,"ORDERLIST"	,"/order/order_list","Y"],
        ["통합주문서"		,"TOTALBOOK"	,"/order/total_order_list","N"],
        ["국제선예약"	   ,"INTERORDER"	,"/interSearch/interRev","Y"],
        ["국제선예약목록"	,"INTERLIST"	,"/air/order_list","Y"],
        ["국내선예약"	    ,"DOMEORDER"	,"/domSearch/domRev","Y"],
        ["국내선예약목록"	,"DOMELIST"	,"/domSearch/dom_list","Y"],
        ["항공및견적요청"	,"GROUPAIR"	,"/Group/group_list","N"],
        ["할인항공예약"		,"BLOCKAIR"	,"/air/air_block","N"],
        ["골프예약(리뉴얼)"	,"GOLF"		,"/rev/golf_rev","N"],
        ["재발행"		,"REVAL"	,"/air/reval_list","N"],
        ["항공리스트(달력)"	,"AIRCAL"	,"/stats/air_calendar","N"],
        ["문자일림"		,"SMS"		,"/DirectSend/send_list","N"]
    ],
    "정산목록;fa-chart-pie" : [
        ["정산목록"		,"SETTLELIST"	,"/order/settle_list","N"],
        ["국제선정산"		,"DSRLISTPRINT"	,"/aviation/issue_list_print"],
        ["발권데이터"		,"DSRLIST"	,"/aviation/issue_list","Y"],
        ["항공리스트(달력)"	,"AIRLISTCAL"	,"/stats/air_calendar",""],
        ["항공환불"		,"REFUND"	,"/refund/refund_list","Y"],
        ["인보이스"		,"AIRINVOICE"	,"/company/invoice","N"]
    ],
    "게시판관리;fa-object-group"  : [
        ["뉴스관리"		,"NEWS"		,"/bbs/news_list"],
        ["제휴문의"		,"PARTNER"	,"/bbs/partnership_list","N"], 
        ["공지사항"		,"NOTICE"	,"/bbs/notice_list"],
        ["고객문의"		,"ONTTOONE"	,"/bbs/onetoone_list","N"],
        ["프로모션관리"		,"PROMO"	,"/bbs/event_list","N"],
        ["상품문의"		,"GOODSQNA"	,"/bbs/question_list","N"],
        ["스캔목록"		,"SCAN"		,"/bbs/scan_list","Y"],
        ["FAQ"			,"FAQ"		,"/bbs/faq_list","N"],
        ["리뷰게시판"		,"REVIEW"	,"/bbs/review_list","N"],
        ["개발요청"		,"DEV"		,"/bbs/dev_list","N"]
    ],
    "항공기초관리;fa-plane" : [
        ["공항코드관리"		,"PORTMAN"	,"/air/port_list"],
        ["항공사관리"		,"AIRMAN"	,"/air/air_list"],
        ["항공편타임테이블"	,"AIRTIME"	,"/air/flight_list","N"],
        ["항공사프로모션"	,"AIRPROMO"	,"/air/promotion_list","N"],
        ["국내선규정"		,"DOMERULE"	,"/air/domrule_list"],
        ["국내선할인조건"	,"DOMEDC"	,"/air/domdc_list"],
        ["국제선규정"		,"INTERRULE"	,"/air/interrule_list"],
        ["지역별요금"		,"PARTAMOUNT"	,"/air/price_list"],
        ["항공사수수료관리"	,"AIRCOMM"	,"/air/commision_list"],
        ["항공사지급컴관리"	,"AIRCOMM2"	,"/air/airOutComm_list","N"]
    ],
    
    "항공인벤관리;fa-boxes" : [
        ["인벤요금관리"		,"AIRFARE"	,"/Block/fare_list"],
        ["항공편타임테이블"	 ,"AIRTIME2"	,"/Block/flight_list"],
        ["항공사규정관리"	,"INVRULE"	,"/Block/airRefund_list"	,"Y"],
        ["캐빈관리"		   ,"CABIN"	,"/Block/airClass_list"],
    ],
    
    
    "회계관리;fa-receipt"  : [
        ["상품별입금내역"	,"GOODSIN"	,"/card/card_list"],
        ["입지결관리"		,"ACTLIST"	,"/bill/act_list"	,"Y"],
        ["출금등록관리"		,"MONEYOUT"	,"/bill/outsite_list"],
        ["환불대장"		,"REFUNDLIST"	,"/bill/refund_list"],
        ["계정코드관리"		,"ACCCODE"	,"/bill/bill_list"],
        ["거래은행관리"		,"BANKMAN"	,"/initail/expense_list"],
        ["환율관리"		,"EXCHANGE"	,"/initail/exrate_list"],
        ["월별입지출내역"	,"MONTHIN"	,"/bill/month_benefit"],
        ["타스프대장"		,"TASFMAN"	,"/aviation/tasf_list"]
    ],
    
    "계좌관리;fa-won-sign"  : [
        ["온라인통장"		,"VISUALBANK"	,"/visualBank/visual_list"	,"Y"],
        ["법인카드승인"		,"COMCARD"	,"/card/businesscard_list","N"],
        ["손님카드승인"		,"CUSCARD"	,"/card/cardauth_list"],
        ["국제선승인"		,"INTERCARD"	,"/card/intercard_list"],
        ["현금영수증"		,"CASHBILL"	,"/gdsCashBill/cashbill_list","N"],
        ["가상계좌관리"		,"VISUAL2"	,"/visualBank/bank_list"],
        ["예치금내역"		,"INOUTLIST"	,"/vavs/input_list"	,"N"],
        ["입금요청내역"		,"INREQUEST"	,"/vavs/input_request"	,"N"],
        ["출금요청내역"		,"OUTREQUEST"	,"/vavs/request"	,"N"],
        ["커미션대장"		,"COMMLIST"	,"/visual/comm_list"	,"N"]
    ],
    
    "정산및통계;fa-chart-line"  : [
        ["상품매출"		,"GOODSSTATS"	,"/stats/goods_list"],
        ["상품매출(거래처별)"	,"GOODSSTATS2"	,"/stats/goods_site_list"],
        ["항공매출"		,"STATS"	,"/stats/total_list"],
        ["항공매출(항공사별)"	,"STATSAIR"	,"/stats/air_list"],
        ["항공매출(거래처별)"	,"STATSITE"	,"/stats/site_list"],
        ["항공정산(거래처별)"	,"STATSETTLE"	,"/stats/settle_list"],
        ["항공VI정산"		,"STATSETTLE1"	,"/stats/settle_list_vi","N"],
        ["항공VI2정산"		,"STATSETTLE2"	,"/stats/settle_list_vi2","N"],
        ["노선별현황표"		,"ROUTE"	,"/stats/route_list"],
        ["항공사실적관리"	,"AIRSETTLE"	,"/stats/perfor_list"]
    ],
    "업무관리;fa-clipboard"  : [
        ["업무일정"		,"BUSINESS"	,"/business/business_list"],
        ["인보이스관리"		,"INVOICE2"	,"/jobSchedule/invoice_list"],
        ["휴가원"		,"VACAITION"	,"/member/vacation_list"]
    ],
    "기초관리;fa-key"  : [
        ["기초코드관리"		,"BASICCODE"	,"/initail/code_manager"],
        ["지역관리"		,"COUNTRY"	,"/initail/category"],
        ["지역관리(호텔)"	,"COUNTRYHO"	,"/mapping/category","N"],
        ["항공사Bin관리"	,"AIRBIN"	,"/air/bin_list"],
        ["지역이미지관리"	,"COUNTRYIMG"	,"/initail/category_image","N"],
        ["인기지역관리"		,"POPCOUNTRY"	,"/initail/popular","N"],
        ["번역관리"		,"TRANSCHANGE"	,"/initail/trans_list","N"],
        ["단어관리"		,"WORDCHANGE"	,"/initail/word_list","N"],
        ["url변환"		,"URLTRANS"	,"/initail/short_list","N"],
        ["쿠폰관리"		,"COUPON"	,"/coupon/coupon_list","N"],
        ["쿠폰발행목록"		,"COUPONLIST"	,"/coupon/coupon_data","N"],
        ["날씨지역코드"		,"WEATHER"	,"/initail/weather_city","N"],
        ["QR생성"		,"QRCREATE"	,"/initail/qr_create","N"],
        ["거부항목"		,"REJECTIP"	,"/initail/reject","N"]
    ],
    "멤버관리;fa-handshake"  : [
        ["관리자관리"		,"ADMINMAN"	,"/member/manager"],
        ["거래처관리"		,"SITEMAN"	,"/site/site_list"],
        ["템플릿거래처"		,"TEMPMAN"	,"/site/temp_list","N"],
        ["알림톡현황"		,"ALRIM"	,"/site/alrim_list","N"],
        ["회원목록"		,"MEMBERLIST"	,"/member/member_list"],
        ["파트너멤버"		,"PARTNERMEN"	,"/member/partner_member_list","N"],
        ["방문자보기"		,"VISITLIST"	,"/member/visit_list","N"],
        ["후급증관리"		,"PRICE"	,"/member/price_list","N"]
    ],
    "로그관리;fa-search"  : [
        ["항공검색로그"		,"AIRLOG"	,"/logData/airsearch_list"],
        ["네이버검색"		,"NAVERSEARCH"	,"/logData/naversearch_list" , "N"],
        ["네이버랜딩"		,"NAVERLAND"	,"/logData/naverlanding_list", "N"],
        ["로그인관련"		,"LOGINLOG"	,"/logData/login_list"],
        ["GDS로그"		,"GDSLOG"	,"/logData/gds_list"],
        ["메모보기"		,"MEMOVIEW"	,"/logData/memo_list","N"],
        ["아이피관리"		,"IPMAN"	,"/logData/login_ip","N"],
        ["템플릿접속"		,"TEMPLOG"	,"/logData/visit_list","N"]
    ]
    
}

module.exports = {
    menuJson
}