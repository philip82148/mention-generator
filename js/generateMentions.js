import { shortenMentions } from "./shortenMentions.js";

export function generateMentions(csvArray, pageSource, shorten) {
  const submittedMembers = [];
  const unSubmittedMembers = [];
  const lineNames = [];
  const regexps = [];
  for (const csvRow of csvArray) {
    const { regexps: regexpsPerMember, ...member } = searchForMember(
      csvRow,
      pageSource
    );
    if (member.hitKeyword) {
      submittedMembers.push(member);
    } else {
      unSubmittedMembers.push(member);
    }
    lineNames.push(member.lineName);
    regexps.push(...regexpsPerMember);
  }

  let mentions = unSubmittedMembers.map((member) => "@" + member.lineName);
  if (shorten) mentions = shortenMentions(mentions, lineNames);

  return { mentions, submittedMembers, unSubmittedMembers, regexps };
}

function searchForMember(csvRow, pageSource) {
  const fullName = String(csvRow[0]).trim();
  const lineName = String(csvRow[csvRow.length - 1])
    .trim()
    .replace(/^[@＠]/, "");

  const regexps = [];
  for (let i = 0; ; i++) {
    const searchKeyword = String(csvRow[i]).trim();
    if (!searchKeyword) continue;

    // lineNameは検索しない。但し要素数が1個しかないときは別
    if (i >= csvRow.length - 1 && csvRow.length > 1) break;

    // 空白は空白を任意の数含む文字として検索
    const regexp = new RegExp(
      escapeRegexp(searchKeyword).replace(/[ 　]+/g, "( |　|&nbsp;)*"),
      "ig"
    );
    regexps.push(regexp);

    // 検索
    if (pageSource.match(regexp))
      return { regexps, fullName, lineName, hitKeyword: searchKeyword };
  }

  return { regexps, fullName, lineName };
}

function escapeRegexp(string) {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");
}
