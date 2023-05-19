import { shortenMentions } from "./shortenMentions.js";

export function generateMentions(members, pageSource, shorten) {
  const submittedMembers = [];
  const unSubmittedMembers = [];
  const lineNames = [];
  const regexps = [];
  for (const member of members) {
    const [resultMember, regexpsPerMember] = searchForMember(
      member,
      pageSource
    );
    if (resultMember.hitKeyword) {
      submittedMembers.push(resultMember);
    } else {
      unSubmittedMembers.push(resultMember);
    }
    lineNames.push(resultMember.lineName);
    regexps.push(...regexpsPerMember);
  }

  let mentions = unSubmittedMembers.map((member) => "@" + member.lineName);
  if (shorten) mentions = shortenMentions(mentions, lineNames);

  return { mentions, submittedMembers, unSubmittedMembers, regexps };
}

function searchForMember(member, pageSource) {
  const fullName = member[0].trim();
  const lineName = member[member.length - 1].trim().replace(/^[@＠]/, "");

  const regexps = [];
  for (let i = 0; ; i++) {
    const searchKeyword = member[i].trim();
    if (!searchKeyword) continue;

    // lineNameは検索しない。但し要素数が1個しかないときは別
    if (i >= member.length - 1 && member.length > 1) break;

    // 空白は空白を任意の数含む文字として検索
    const regexp = new RegExp(
      escapeRegexp(searchKeyword).replace(/[ 　]+/g, "( |　|&nbsp;)*"),
      "ig"
    );
    regexps.push(regexp);

    // 検索
    if (pageSource.match(regexp))
      return [{ fullName, lineName, hitKeyword: searchKeyword }, regexps];
  }

  return [{ fullName, lineName }, regexps];
}

function escapeRegexp(string) {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");
}
