function getPagination({ tot_row, page = 1, listCount = 15, loopcnt = 5 }) {
    page = parseInt(page, 10);
    listCount = parseInt(listCount, 10);
    loopcnt = parseInt(loopcnt, 10);
  
    const sp_num = listCount;
    const page_num = Math.ceil(tot_row / sp_num);
    const startRow = (page - 1) * listCount + 1;
    const endRow = page * listCount;
  
    let startpage;
    if (page > loopcnt) {
      const tmp = page / loopcnt;
      if (Number.isInteger(tmp)) {
        startpage = ((page / loopcnt - 1) * loopcnt) + 1;
      } else {
        startpage = (Math.floor(page / loopcnt) * loopcnt) + 1;
      }
    } else {
      startpage = 1;
    }
  
    let pagestr = "";
  
    // 처음 / 이전
    //if (startpage > 1) {
      const prevPage = startpage - 1;
      const firstPage = 1;
      pagestr += `<button class="action_page_btn" onclick="searchPagingChange('${firstPage}')">처음</button>`;
      //pagestr += `<li><span class='j-prev' onclick="searchPagingChange('${prevPage}')">이전</span></li>`;
      pagestr += `<button class="action_page_btn" onclick="searchPagingChange('-')">◀</button>`;

    //}
  
    // 페이지 번호
    for (let i = startpage; i <= page_num; i++) {
      if (i === page) {
        //pagestr += `<li class="active"><span>${i}</span></li>`;
        pagestr += `<button class="action_page_btn is-active">${i}</button>`;
      } else {
        //pagestr += `<li><span onclick="searchPagingChange('${i}')">${i}</span></li>`;
        pagestr += `<button class="action_page_btn" onclick="searchPagingChange('${i}')">${i}</button>`;
      }
  
      if (i % loopcnt === 0 && i !== 1 && page_num > loopcnt && i % page_num !== 0) {
        const nextPage = i + 1;
        const str = Math.ceil(page_num / loopcnt);
        const lastPage = (str - 1) * loopcnt + 1;
        //pagestr += `<li><span class='j-next' onclick="searchPagingChange('${nextPage}')">다음</span></li>`;
        pagestr += `<button class="action_page_btn" onclick="searchPagingChange('+')">▶</button>`;
        pagestr += `<button class="action_page_btn" onclick="searchPagingChange('${lastPage}')">마지막</button>`;
        //pagestr += `<button class="action_page_btn" onclick="searchPagingChange('${lastPage}')">▶</button>`;
        break;
      }
    }
  
    const fullPageHTML = `
      ${pagestr}
    `;
  
    return {
      startRow,
      endRow,
      pageHTML: fullPageHTML
    };
  }
  
module.exports = {
    getPagination
};