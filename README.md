# インストール方法・使い方

ルートフォルダ内の Mention Generator インストール方法.pdf を見てください。

## member-list.csv の作り方

member-list-sample.csv を参考にして以下のように作成してください。

1. 同じ行に同じ人の情報を並べてください。
2. 姓と名の間はスペースを空けると、スペースが入っていても入っていなくても検索にヒットするようになります。  
   例)「山田　太郎」->「山田　太郎」や「山田太郎」にヒットする。なお、「山田」にはヒットしない。
3. 一番最後の列は LINE のメンション文の生成に使われ、検索には使われません。  
   なお「@」はついていなくても自動で追加されます。  
   ※先頭に「@」をつけるときは、エクセルでは先頭に「'」をつけて「'@メンション」として入力してください。
4. 一行に二列以上の情報があると、どれか一つがヒットすればその人はメンション文が生成されません。  
   例)「山田　太郎|やまだ|Yamada|@山田太郎」->「山田　太郎」、「やまだ」、「Yamada」(なお大文字と小文字は区別しない)のどれか一つでもヒットすればメンション文に「@山田太郎」は追加されない。  
   ※検索は左から順に行われます。
5. セルの中身はメアドでも構いません。
6. 空白のセルは無視されます。
7. 保存する際は、「CSV UTF-8(コンマ区切り)」で保存してください。

### 参考

```excel
LEFT(A2,FIND(" ",A2)-1)、MID(A2,FIND(" ",A2)+1,1000)
```

空白で文字列を区切る Excel 関数。フルネームから名前・苗字を分離するのに便利。
