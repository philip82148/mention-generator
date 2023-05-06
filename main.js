import { csvFileToArray, csvStringToArray } from "./csv-js/csv.js";

$(() => {
  const defaultMembersCsvName = "member-list.csv";
  const $message = $("#message");

  generateMentions();

  $("#members-csv").on("change", function () {
    generateMentions();
  });
  $("form").on("reset", function () {
    $("#members-csv").val("");
    generateMentions();
  });

  async function generateMentions() {
    $message.text(`検索中…`);
    $(".result").text("");

    let membersCsv = $("#members-csv").prop("files")[0];

    if (membersCsv) {
      $(".selected-file").html(`<b>${membersCsv.name}</b>`);
    } else {
      membersCsv = await fetchDefaultMembersCsv();
      $(".selected-file").html(
        `インストールフォルダ内:<b>${defaultMembersCsvName}</b>`
      );
    }

    searchAndShowResult(
      await fetchPageSource(),
      await csvToTrimmedArray(membersCsv)
    );
  }

  async function fetchDefaultMembersCsv() {
    return $.ajax({
      method: "get",
      url: defaultMembersCsvName,
    }).catch(() => {
      alert("member-list.csvが存在しません！");
    });
  }

  async function fetchPageSource() {
    return new Promise(function (resolve, reject) {
      // ページソースが取れた時の操作
      let isFirst = true;
      chrome.runtime.onMessage.addListener(function (request, sender) {
        if (request.action === "getSource" && isFirst) {
          isFirst = false;
          resolve(request.source);
        }
      });

      // ページソース取得スクリプト挿入
      chrome.tabs.query(
        {
          currentWindow: true,
          active: true,
        },
        function (tabs) {
          chrome.scripting.executeScript(
            {
              target: { tabId: tabs[0].id, allFrames: true },
              files: ["getPagesSource.js"],
            },
            function () {
              // If you try and inject into an extensions page or the webstore/NTP you'll get an error
              if (chrome.runtime.lastError) {
                $message.text(
                  "There was an error injecting script : \n" +
                    chrome.runtime.lastError.message
                );
              }
            }
          );
        }
      );
    });
  }

  // CSVファイルを読み込む。但し、全てのセルをtrimし、空白のセルは無視したarrayを作る
  async function csvToTrimmedArray(fileObject) {
    if (typeof fileObject === "string") {
      return csvStringToArray(fileObject);
    }

    return csvFileToArray(fileObject);
  }

  function searchAndShowResult(pageSource, memberList) {
    const resultMemberList = [];

    let isFirst = true;
    let keywords = "";
    for (const member of memberList) {
      // 結果表に情報代入
      const memberResult = {
        fullName: member[0],
        lineName: member[member.length - 1],
        hitWord: "",
      };
      resultMemberList.push(memberResult);

      // 検索
      let i = 0;
      for (const searchTerm of member) {
        // lineNameは検索しない。但し要素数が1個しかないときは別
        if (i >= member.length - 1 && member.length > 1) break;
        i++;

        // 空白は空白を任意の数含む文字として検索
        // 途中のreplaceはエスケープ
        const searchRegExp = searchTerm
          .replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&")
          .replace(/[ 　]+/g, "( |　|&nbsp;)*");

        // クエリ表示
        if (isFirst) {
          keywords += '"' + searchRegExp + '"';
          isFirst = false;
        } else {
          keywords += '、"' + searchRegExp + '"';
        }

        // 検索
        if (pageSource.search(new RegExp(searchRegExp, "ig")) !== -1) {
          memberResult["hitWord"] = searchTerm;
          break;
        }
      }
    }

    const unAtAndConvertMentionForComparison = function (originalMention) {
      // @を消して半角スペース、小文字、平仮名、半角記号に変換する
      return originalMention
        .replace(/^[@＠]/, "")
        .replace(/　/g, " ")
        .toLowerCase()
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
    };

    /*    const shortenMention = function(originalMention) {
        let length = 2;

		if(length >= originalMention.length)
			return originalMention;

		let shortenedMention = originalMention.substring(0, length);
        const convertedMention = convertMention(originalMention);
        for(const member of resultMemberList) {
            const convertedLineName = convertMention(member['lineName']);

            // それ自身は無視
            if(convertedLineName === convertedMention) continue;
            while(convertedLineName.indexOf(convertMention(shortenedMention)) !== -1) {
                length++;
				if(length >= originalMention.length)
					return originalMention;

				shortenedMention = originalMention.substring(0, length);
            }
        }
    
        return shortenedMention;
    }; */

    const convertMention = function (originalMention, shorten) {
      // 以下、一旦@を削除して最後に@をくっつける
      const unAttedMention = originalMention.replace(/^[@＠]/, "");

      // 短くしないか、もともと1文字
      if (!shorten || unAttedMention.length <= 1) return "@" + unAttedMention;

      const convertedMention =
        unAtAndConvertMentionForComparison(originalMention);

      const indexesToShortenedMention = new Array(convertedMention.length);
      for (let index = 0; index < convertedMention.length; index++) {
        indexesToShortenedMention[index] = convertedMention.substr(index, 1);
        // 一文字目がスペースならメンションにならないので捨てる
        if (indexesToShortenedMention[index].match(/[ ]/))
          indexesToShortenedMention[index] = convertedMention;
      }

      let minLength = 1;
      let minLengthIndex = 0;
      for (const member of resultMemberList) {
        const convertedLineName = unAtAndConvertMentionForComparison(
          member["lineName"]
        );
        // それ自身は無視
        if (convertedLineName === convertedMention) continue;

        // ループの度にminLength, minLengthIndexを更新する
        minLength = convertedMention.length;
        for (let index = 0; index < convertedMention.length; index++) {
          let currentLength = indexesToShortenedMention[index].length;
          // このインデックスに見込みがない
          if (currentLength >= convertedMention.length) continue;

          // それぞれのindexから始まるshortenedMentionを更新する
          while (
            convertedLineName.indexOf(indexesToShortenedMention[index]) !== -1
          ) {
            // 次の空白でない文字を探す
            const additionalLength = convertedMention
              .substr(index + currentLength)
              .search(/[^ ]/g);

            // 見つからなければ(終端に達すれば)このインデックスは捨てる
            if (additionalLength === -1) {
              indexesToShortenedMention[index] = convertedMention;
              currentLength = convertedMention.length;
              break;
            }

            currentLength += additionalLength + 1;
            indexesToShortenedMention[index] = convertedMention.substr(
              index,
              currentLength
            );
          }

          // 一番小さい最初のLengthを記録する
          if (currentLength < minLength) {
            minLength = currentLength;
            minLengthIndex = index;
          }
        }

        if (minLength >= convertedMention.length) return "@" + unAttedMention;
      }

      // 大文字小文字とかをそのままにしたいのでunAttedから切り出す
      return "@" + unAttedMention.substr(minLengthIndex, minLength);
    };

    // 結果表示
    const explanationIfChecked =
      "コピペして左から(候補が出るのを待って)エンターキーかタブキーで確定させてください。";
    $message.html(
      `<p><label><input type="checkbox" checked>極小のメンションを使う</label></p>
        <p class="explanation">${explanationIfChecked}</p>
        <div class="mentions"></div>`
    );

    // メンション文等作成
    let mentions = []; // メンション文
    let notSubmitted; // 名前が見つかった人
    let submitted; // 名前が見つからなかった人
    let notSubmittedCount;
    let submittedCount;
    const showMentionsAndCreateDetails = function (shorten) {
      mentions = []; // 20個ごとに別の配列に加える
      notSubmitted = submitted = "";
      notSubmittedCount = submittedCount = 0;
      let isNotSubmittedFirst = true;
      let isSubmittedFirst = true;
      for (const memberResult of resultMemberList) {
        if (memberResult["hitWord"]) {
          if (isSubmittedFirst) {
            submitted = '"' + memberResult["fullName"] + '"';
            isSubmittedFirst = false;
          } else {
            submitted += '、"' + memberResult["fullName"] + '"';
          }
          submitted += '("' + memberResult["hitWord"] + '")';
          submittedCount++;
        } else {
          const mention = convertMention(memberResult["lineName"], shorten);
          if (isNotSubmittedFirst) {
            mentions.push(mention);
            notSubmitted = '"' + memberResult["fullName"] + '"';
            isNotSubmittedFirst = false;
          } else {
            if (notSubmittedCount % 20) {
              mentions[mentions.length - 1] += " " + mention;
            } else {
              mentions.push(mention);
            }
            notSubmitted += '、"' + memberResult["fullName"] + '"';
          }
          notSubmittedCount++;
        }
      }

      const $mentions = $message.find(".mentions");

      $mentions.html(`<h3>未回答者</h3>`);

      if (!notSubmittedCount) {
        const $p = $("<p></p>");
        $p.text("おめでとうございます！未回答者0人です！");
        $mentions.append($p);
        return;
      }

      for (const mention of mentions) {
        const $p = $("<p></p>");
        $p.text(mention);
        $p.click(function () {
          if (!navigator.clipboard) return;

          navigator.clipboard.writeText(mention).then(function () {
            let firstMention = "";
            if (mention.length <= 9) {
              firstMention = mention;
            } else {
              firstMention =
                mention.substr(0, 9).replace(/@$/, "").trim() + "...";
            }
            showBanner(firstMention + "をコピーしました。");
          });
        });
        $mentions.append($p);
      }
    };

    showMentionsAndCreateDetails(true);

    $message.find("input").on("change", function () {
      showMentionsAndCreateDetails($(this).prop("checked"));
      $message
        .find(".explanation")
        .html($(this).prop("checked") ? explanationIfChecked : "");
    });

    $(".count").text(String(resultMemberList.length));

    $(".submitted").text(submitted + "(" + String(submittedCount) + "人)");

    $(".not-submitted").text(
      notSubmitted + "(" + String(notSubmittedCount) + "人)"
    );

    $(".keywords").text(keywords);
  }

  function showBanner(text) {
    if ($(".banner").length) $(".banner").remove();

    const $banner = $(`<div class="banner"></div>`);
    $banner.text(text);
    $("body").append($banner);
    setTimeout(function () {
      $banner.fadeOut("normal", function () {
        $banner.remove();
      });
    }, 3000);
  }
});
