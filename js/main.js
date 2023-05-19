import { csvFileToArray, csvUrlToArray } from "./csv-js/csv.js";
import { fetchPageSource } from "./getPageSource.js";
import { generateMentions } from "./generateMentions.js";
import { showBanner } from "./showBanner.js";

const DefaultInputCsvPath = "member-list.csv";

$(() => {
  $("#input-csv").on("change", () => {
    main();
  });
  $("#reset-button").on("click", () => {
    $("#input-csv").val("");
    main();
  });
  $("#shorten-mention-checkbox").on("change", () => {
    main();
  });

  $("#control").hide();
  $("#shorten-mention-checkbox").prop("checked", true);
  main();
});

async function main() {
  $("#output").text("検索中…");

  const csvArray = await (async () => {
    const inputFile = $("#input-csv").prop("files")[0];
    if (inputFile) {
      try {
        const $b = $(`<b></b>`).text(inputFile.name);
        $("#selected-file-display").empty().append($b);
        return await csvFileToArray(inputFile);
      } catch (e) {
        $("#control").hide();
        $("#output").text(
          `エラーが発生しました: メンバーズファイル(${inputFile.name})が読み取れません`
        );
        throw e;
      }
    } else {
      try {
        const $b = $(`<b></b>`).text(DefaultInputCsvPath);
        $("#selected-file-display").text(`インストールフォルダ内:`).append($b);
        return await csvUrlToArray(DefaultInputCsvPath);
      } catch (e) {
        $("#control").hide();
        $("#output").text(
          `エラーが発生しました: デフォルトメンバーズファイル(${DefaultInputCsvPath})が読み取れません`
        );
        throw e;
      }
    }
  })();

  const pageSource = await (async () => {
    try {
      return await fetchPageSource();
    } catch (e) {
      $("#control").hide();
      $("#output").text(`エラーが発生しました: ページソースが読み取れません`);
      throw e;
    }
  })();

  const shortenMentions = $("#shorten-mention-checkbox").prop("checked");
  if (shortenMentions) {
    $("#shorten-mention-explanation").show();
  } else {
    $("#shorten-mention-explanation").hide();
  }

  const { mentions, submittedMembers, unSubmittedMembers, regexps } =
    generateMentions(csvArray, pageSource, shortenMentions);

  $("#output").html(`<h2>未回答者</h2>`);
  if (!unSubmittedMembers.length) {
    const $p = $("<p>おめでとうございます！未回答者0人です！</p>");
    $("#output").append($p);
    $("#control").hide();
  } else {
    do {
      const _20mentionString = mentions.splice(0, 20).join(" ");
      const $p = $(`<p></p>`).text(_20mentionString);
      $p.click(() => {
        if (!navigator.clipboard) return;

        navigator.clipboard.writeText(_20mentionString).then(() => {
          let startString = "";
          if (_20mentionString.length <= 9) {
            startString = _20mentionString;
          } else {
            startString =
              _20mentionString.substring(0, 9).replace(/@$/, "").trim() + "...";
          }
          showBanner(startString + "をコピーしました。");
        });
      });
      $("#output").append($p);
    } while (mentions.length);
    $("#control").show();
  }

  $("#number-of-members .count").text(
    submittedMembers.length + unSubmittedMembers.length
  );

  $("#submitted-members .count").text(submittedMembers.length);
  $("#submitted-members .content").text(
    submittedMembers
      .map((member) => `"${member.fullName}"("${member.hitKeyword}")`)
      .join("、")
  );

  $("#un-submitted-members .count").text(unSubmittedMembers.length);
  $("#un-submitted-members .content").text(
    unSubmittedMembers.map((member) => `"${member.fullName}"`).join("、")
  );

  $("#regexps .count").text(regexps.length);
  $("#regexps .content").text(
    regexps.map((regexp) => regexp.toString()).join("、")
  );
}
