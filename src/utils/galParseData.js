// 갈릴레오 검색시 응답값 
const galArrFlight = [
"Key",
"DestinationTerminal",
"OriginTerminal",
"Equipment",
"FlightTime",
"ArrivalTime",
"DepartureTime",
"Destination",
"Origin"
];

const galArrSegment = [
"Key",
"Group",
"Carrier",
"FlightNumber",
"Origin",
"Destination",
"DepartureTime",
"ArrivalTime",
"FlightTime",
"Distance",
"ETicketability",
"Equipment",
"ChangeOfPlane",
"ParticipantLevel",
"LinkAvailability",
"PolledAvailabilityOption",
"OptionalServicesIndicator",
"AvailabilitySource",
"AvailabilityDisplayType",
"NumberOfStops"
];

const galArrFare = [
"Key",
"FareBasis",
"PassengerTypeCode",
"Origin",
"Destination",
"EffectiveDate",
"DepartureDate",
"Amount",
"NegotiatedFare",
"NotValidAfter"
];


const galArrPrice = [
"Key",
"TotalPrice",
"BasePrice",
"ApproximateTotalPrice",
"ApproximateBasePrice",
"Taxes",
"ApproximateTaxes",
"CompleteItinerary"
];

const galArrPriceInfo = [ 
"Key",
"TotalPrice",
"BasePrice",
"ApproximateTotalPrice",
"ApproximateBasePrice",
"Taxes",
"LatestTicketingTime",
"PricingMethod",
"Refundable",
"ETicketability",
"PlatingCarrier",
"ProviderCode"
];

const galArrTax = [
"Category",
"Amount"
];

const galArrPriceOption = [
	"LegRef",
	"Destination",
	"Origin"
];

const galArrPriceOption2 = [
	"Key",
	"TravelTime"
];

const galArrPriceOption3 = [
	"BookingCode",
	"BookingCount",
	"CabinClass",
	"FareInfoRef",
	"SegmentRef"
];

const galArrBland = [
"Key",
"BrandID",
"Name",
"BrandedDetailsAvailable",
"Carrier"
];

const galArrBland2 = [
"Title",
"Text",
"ImageLocation",
];

const galRuleData = {
    "0": "APPLICATION AND OTHER CONDITIONS",
    "1": "Eligibility",
    "2": "Day/Time",
    "3": "Seasonality",
    "4": "Flight Application",
    "5": "Advance Reservations/Ticketing",
    "6": "Minimum Stay",
    "7": "Maximum Stay",
    "8": "Stopovers",
    "9": "Transfers",
    "10": "Combinations",
    "11": "Blackout Dates",
    "12": "Surcharges",
    "13": "Accompanied Travel",
    "14": "Travel Restrictions",
    "15": "Sales Restrictions",
    "16": "Penalties",
    "17": "HIP/Mileage Exceptions",
    "18": "Ticket Endorsements",
    "19": "Children Discounts",
    "20": "Tour Conductor Discounts",
    "21": "Agent Discounts",
    "22": "All Other Discounts",
    "23": "Miscellaneous Provisions",
    "24": "n/a",
    "25": "Fare by Rule",
    "26": "Groups",
    "27": "Tours",
    "28": "Visit Another Country",
    "29": "Deposits",
    "31": "Voluntary Changes",
    "33": "Voluntary Refunds",
    "35": "Negotiated Fare Restrictions",
    "50": "Application and Other Conditions"
  };
  


// 갈릴레오 좌석 응답값 상세 정보
const galSeatDetail = {
    "1A": "Seat not allowed for infant",
    "1B": "Seat not allowed for medical",
    "1W": "Window seat without window",
    "CH": "PaidGeneralSeat",
    "E": "ExitRow",
    "IE": "Seat not suitable for child",
    "LS": "Left side of aircraft",
    "V": "Seat to be left vacant or offered last",
    "9": "Center seat (not window, not aisle)",
    "A": "Aisle",
    "2": "LegRest",
    "B": "Bassinet",
    "K": "Bulkhead",
    "H": "Handicapped",
    "L": "ExtraLegRoom",
    "RS": "Right side of aircraft",
    "O": "Preferential",
    "W": "Window",
    "EK": "Economy comfort seat",
    "1": "Restricted seat - General",
    "Q": "Seat in a quiet zone",
    "AL": "Seat adjacent to lavatory",
    "PC": "Pet cabin",
    "AG": "Seat adjacent to galley",
    "I": "Seat suitable for adult with an infant"
};
  
module.exports = {
    galArrFlight,
    galArrSegment,
    galArrFare,
    galArrPrice,
    galArrPriceInfo,
    galArrTax,
    galArrPriceOption,
    galArrPriceOption2,
    galArrPriceOption3,
    galArrBland,
    galArrBland2,
    galRuleData,
    galSeatDetail
}