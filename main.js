import { csvFileToArray, csvUrlToArray } from "./csv-js/csv.js";
import { fetchPageSource } from "./getPageSource.js";
import { searchAndShowResult } from "./generateMention.js";

const DefaultInputCsvPath = "member-list.csv";

$(() => {
  $("#input-csv").on("change", () => {
    main();
  });
  $("form").on("reset", () => {
    $("#input-csv").val("");
    main();
  });

  main();
});

async function main() {
  try {
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

    searchAndShowResult(csvArray, pageSource);
  } catch (e) {
    $("#message").text(`エラーが発生しました: ${e}`);
    throw e;
  }
}
