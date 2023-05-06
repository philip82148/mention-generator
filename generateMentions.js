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
  const lineName = unAt(member[member.length - 1].trim());

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

function shortenMentions(mentions, lineNames) {
  const loweredNames = lineNames.map((lineName) => lowerAll(lineName));
  return mentions.map((mention) => {
    const lineName = unAt(mention);
    const loweredName = lowerAll(lineName);

    const [shortestString, index] = getShortestUniqueString(
      loweredName,
      loweredNames
    );
    return "@" + lineName.substring(index, index + shortestString.length);
  });
}

function getShortestUniqueString(string, strings) {
  strings = strings.filter((from) => from !== string);

  // length=1~string.length-1
  // length=string.lengthはしない
  for (let length = 1; length < string.length; length++) {
    // index=0~string.length-length(lengthを引いて余ったスペースだけ動く)
    for (let index = 0; index <= string.length - length; index++) {
      const substring = string.substring(index, index + length);

      // 検索するsubstringがスペースで囲まれている場合スキップ
      if (substring.match(/^\s|\s$/)) continue;

      // 全てにsubstringが含まれていなければそのsubstringを返す
      if (strings.every((target) => !target.includes(substring)))
        return [substring, index];
    }
  }

  return [string, 0];
}

function escapeRegexp(string) {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");
}

function unAt(mention) {
  return mention.replace(/^[@＠]/, "");
}

function lowerAll(string) {
  // 半角スペース、小文字、平仮名、半角記号に変換する
  return string
    .toLowerCase() // 小文字
    .replace(/[ァ-ン]/g, function (s) {
      return String.fromCharCode(s.charCodeAt(0) - 0x60);
    })
    .replace(
      /[Ａ-Ｚａ-ｚ０-９！＂＃＄％＆＇（）＊＋，－．／：；＜＝＞？＠［＼］＾＿｀｛｜｝]/g,
      function (s) {
        return String.fromCharCode(s.charCodeAt(0) - 0xfee0);
      }
    )
    .replace(/[‐－―]/g, "-") // ハイフンなど
    .replace(/[～〜]/g, "~") // チルダ
    .replace(/　/g, " "); // スペース
}
