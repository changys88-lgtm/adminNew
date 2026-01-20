const { cutDate } = require('../utils/cutDate');
function checkMonth(month,type='A') {
    if (type === "A") {
        const months = {
            "JAN": "01",
            "FEB": "02",
            "MAR": "03",
            "APR": "04",
            "MAY": "05",
            "JUN": "06",
            "JUL": "07",
            "AUG": "08",
            "SEP": "09",
            "OCT": "10",
            "NOV": "11",
            "DEC": "12"
        };
    
        month = month.toUpperCase();  
        return months[month] || null; 
    } else if (type === "B") {
        const months = {
            "01": "JAN",
            "02": "FEB",
            "03": "MAR",
            "04": "APR",
            "05": "MAY",
            "06": "JUN",
            "07": "JUL",
            "08": "AUG",
            "09": "SEP",
            "10": "OCT",
            "11": "NOV",
            "12": "DEC"
        };
        return months[month] || null; 
    }
}

function convertDays (str='',type='A',cDate='') {
    if (!str) return '';
    str = str.replace(/[-\/.]/g, "");
    let y1 = '';
    if (type === "C") { // 25SEP -> 25SEP25
        if (str.length === 5) {
            if (cDate) y1 = cDate.slice(2,4);
            else {
                const Year = new Date().getFullYear();
                y1 = String(Year).substring(2, 4);
            }
            str += y1;
            type = 'A';
        }
    } 
    
    if (str.length === 8 && type === "A") {
        return str;
    } else if (str.length === 7 && type === "B") {
        return str;
    } else if (str.length === 7 && type === "A") {
        // 25DEC25 -> 20251225
        let st1 = str.substring(0, 2);
        let st2 = str.substring(2, 5);
        let st3 = str.substring(5, 9);

        const Year = new Date().getFullYear();
        const Year1 = String(Year).substring(0, 2);
        const Year2 = String(Year).substring(2, 4);

        // 년도 처리
        if (st3.length === 1) st3 = Year.toString().substring(0, 3) + st3; // 2022-08-05 추가
        let add;
        if (parseInt(Year2) + 10 < parseInt(st3)) add = parseInt(Year1) - 1;
        else if (parseInt(Year2) > 90 && parseInt(st3) < parseInt(Year2)) add = parseInt(Year1) + 1;
        else add = parseInt(Year1);
        if (st3.length === 4) add = "";

        // 월 변환
        st2 = checkMonth(st2);

        if (st2 === "") return;
        else return add + st3 + st2 + st1;
    } else if (str.length === 8 && type === "B") {
        // 20251225 -> 25DEC25
        let st1 = str.substring(0, 4);
        let st2 = str.substring(4, 6);
        let st3 = str.substring(6, 8);
        
        st2 = checkMonth(st2,'B');
        return st3 + st2 + st1.slice(2,2);
    }
}
function calculateAge (birth='',depDate='') {
    if (!birth) return 'xx';
    if (birth.length === 7) birth = convertDays(birth);
    aStart      = cutDate(depDate).split("-");
    aBirth      = cutDate(birth).split("-");
    let age = parseInt(aStart[0]) - parseInt(aBirth[0]);
    if (aStart[1] < aBirth[1]) {
        age--;
    } else if (aStart[1] === aBirth[1] && aStart[2] < aBirth[2]) {
        age--;
    }
    return age;
}

module.exports = {
    calculateAge , convertDays , checkMonth
};