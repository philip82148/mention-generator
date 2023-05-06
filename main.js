import { csvFileToArray, csvUrlToArray } from "./csv-js/csv.js";
import { fetchPageSource } from "./getPageSource.js";
import { generateMentions } from "./generateMention.js";
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

  $("#shorten-mention-checkbox").prop("checked", true);
  main();
});

async function main() {
  try {
    let shortenMentions = $("#shorten-mention-checkbox").prop("checked");
    if (shortenMentions) {
      $("#shorten-mention-explanation").show();
    } else {
      $("#shorten-mention-explanation").hide();
    }

    $("#message").text("検索中…");

    const csvArray = await (async () => {
      const inputFile = $("#input-csv").prop("files")[0];
      if (inputFile) {
        $("#selected-file-display").html(`<b>${inputFile.name}</b>`);
        return csvFileToArray(inputFile);
      } else {
        $("#selected-file-display").html(
          `インストールフォルダ内:<b>${DefaultInputCsvPath}</b>`
        );
        return csvUrlToArray(DefaultInputCsvPath);
      }
    })();
    const pageSource = await fetchPageSource();

    const { mentions, submittedMembers, unSubmittedMembers, regexps } =
      generateMentions(csvArray, pageSource, shortenMentions);

    $("#message").html(`<h3>未回答者</h3>`);
    if (!unSubmittedMembers.length) {
      const $p = $("<p>おめでとうございます！未回答者0人です！</p>");
      $("#message").append($p);
    } else {
      do {
        const _20mentionString = mentions.splice(0, 20).join(" ");
        const $p = $(`<p>${_20mentionString}</p>`);
        $p.click(() => {
          if (!navigator.clipboard) return;

          navigator.clipboard.writeText(_20mentionString).then(() => {
            let startString = "";
            if (mention.length <= 9) {
              startString = _20mentionString;
            } else {
              startString =
                _20mentionString.substring(0, 6).replace(/\s*@$/, "") + "...";
            }
            showBanner(startString + "をコピーしました。");
          });
        });
        $("#message").append($p);
      } while (mentions.length);
    }

    $("#number-of-people .count").text(
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
  } catch (e) {
    $("#message").text(`エラーが発生しました: ${e}`);
    throw e;
  }
}
