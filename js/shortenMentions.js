export function shortenMentions(mentions, lineNames) {
  const loweredNames = lineNames.map((lineName) => lowerAll(lineName));
  return mentions.map((mention) => {
    const lineName = mention.replace(/^[@＠]/, "");
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
      if (strings.every((string) => !string.includes(substring)))
        return [substring, index];
    }
  }

  return [string, 0];
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
