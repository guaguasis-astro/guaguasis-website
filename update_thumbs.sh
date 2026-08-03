#!/bin/bash

# 更新CSS样式以支持图片
update_css() {
    file="$1"
    sed -i '' '
        s/\.article-image-placeholder {/.article-image-placeholder {
            overflow: hidden;
        }
        .article-image-placeholder img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .article-image-placeholder {/' "$file"
}

# 更新HTML部分 - article 1
update_article_1() {
    sed -i '' 's/<div class="article-image-placeholder">.*<\/div>/<div class="article-image-placeholder">
            <img src="https:\/\/mmbiz.qpic.cn\/mmbiz_png\/ib2p1poQ5qy1LMiaVHfngaMsDLFcGVWbWEpK7pZeRZib1N49xClS2P6ucqT9nOfM730pl7QQ2gGr5oDfjPDzYH1tZsAWMMO2TXZmppKA5icEMlY\/640?wx_fmt=png&from=appmsg#imgIndex=0" alt="文章缩略图">
        <\/div>/' article-1.html
}

# 更新HTML部分 - article 2
update_article_2() {
    sed -i '' 's/<div class="article-image-placeholder">.*<\/div>/<div class="article-image-placeholder">
            <img src="https:\/\/mmbiz.qpic.cn\/mmbiz_png\/ib2p1poQ5qy0zTwL5F22h86jnQtlqzUqGJCoodmrJ0R0MFDaqcAAbo6FwRUZ5nERaEhGSKuc4HgfJ9q9RianwP1v4tNfLlOvxGWJapevJ3EmY\/640?wx_fmt=png&from=appmsg#imgIndex=0" alt="文章缩略图">
        <\/div>/' article-2.html
}

# 更新HTML部分 - article 3
update_article_3() {
    sed -i '' 's/<div class="article-image-placeholder">.*<\/div>/<div class="article-image-placeholder">
            <img src="https:\/\/mmbiz.qpic.cn\/sz_mmbiz_jpg\/HUQjRqLFFZt9Fs6DtKk7dZcuVUefmGmPTyacyeAKyEbMmXiapvIPGsdjDhLREsQj5CvsInTBzsRSlrGyhiaSibW3Q\/640?wx_fmt=jpeg&tp=webp&wxfrom=5&wx_lazy=1#imgIndex=0" alt="文章缩略图">
        <\/div>/' article-3.html
}

# 更新HTML部分 - article 4
update_article_4() {
    sed -i '' 's/<div class="article-image-placeholder">.*<\/div>/<div class="article-image-placeholder">
            <img src="https:\/\/mmbiz.qpic.cn\/sz_mmbiz_jpg\/HUQjRqLFFZtFtmy35ZGZLtJcvgkBsR9kFrR1RGibicBMNGLD8fek5hyoVQpl5xtJLfszickWyzxIib1piabtFfMIZyQ\/640?wx_fmt=jpeg#imgIndex=1" alt="文章缩略图">
        <\/div>/' article-4.html
}

# 更新HTML部分 - article 5
update_article_5() {
    sed -i '' 's/<div class="article-image-placeholder">.*<\/div>/<div class="article-image-placeholder">
            <img src="https:\/\/mmbiz.qpic.cn\/sz_mmbiz_jpg\/HUQjRqLFFZvY43kRBUeVGuDmOeOJYIcPcZ1v7EHxKhM74c6o2XRwoUhcRrdry37kwDP5ibMod24iaCRvmtkXtYA\/640?wx_fmt=jpeg#imgIndex=0" alt="文章缩略图">
        <\/div>/' article-5.html
}

# 更新HTML部分 - article 6
update_article_6() {
    sed -i '' 's/<div class="article-image-placeholder">.*<\/div>/<div class="article-image-placeholder">
            <img src="https:\/\/mmbiz.qpic.cn\/sz_mmbiz_jpg\/HUQjRqLFFZtFSBbU5DqjRxvyouicXe6vnSHL847eYu7RX7Wokom2M4zoYgzXkJ2HRibldgQtjBiaaqtLfcULyFsSg\/640?wx_fmt=jpeg#imgIndex=0" alt="文章缩略图">
        <\/div>/' article-6.html
}

# 更新HTML部分 - article 7
update_article_7() {
    sed -i '' 's/<div class="article-image-placeholder">.*<\/div>/<div class="article-image-placeholder">
            <img src="https:\/\/mmbiz.qpic.cn\/sz_mmbiz_jpg\/HUQjRqLFFZtOPSLktHtpibDhCloaBGgG4m2vzLTTXicNfr6PmYSzIrJ836hFCYVQaicnYKnLc949icggma9vFssBfA\/640?wx_fmt=jpeg&from=appmsg#imgIndex=0" alt="文章缩略图">
        <\/div>/' article-7.html
}

# 更新HTML部分 - article 8 (没有图片，保持emoji)

# 更新HTML部分 - article 9
update_article_9() {
    sed -i '' 's/<div class="article-image-placeholder">.*<\/div>/<div class="article-image-placeholder">
            <img src="https:\/\/mmbiz.qpic.cn\/sz_mmbiz_png\/ib2p1poQ5qy0PFHTQCQS7ve7Nv5HPn2kYBkSp6g3Y0a2swqasyibmxuJUMO1CeSMhTg0liaQZYTfDhcIsjVqAgXa9mLZpg6VVxGZJIwr4Njj2o\/640?wx_fmt=png&from=appmsg&tp=webp&wxfrom=5&wx_lazy=1#imgIndex=0" alt="文章缩略图">
        <\/div>/' article-9.html
}

# 更新HTML部分 - article 10
update_article_10() {
    sed -i '' 's/<div class="article-image-placeholder">.*<\/div>/<div class="article-image-placeholder">
            <img src="https:\/\/mmbiz.qpic.cn\/sz_mmbiz_jpg\/HUQjRqLFFZuahS54u1iaI13Jbiblr6rA5pVKcw2DQPna7aTZwOzI6lhflstYapogqzlnhc4hf6mGletQ2ewgmflQ\/640?wx_fmt=jpeg&tp=webp&wxfrom=5&wx_lazy=1#imgIndex=0" alt="文章缩略图">
        <\/div>/' article-10.html
}

# 更新HTML部分 - article 11
update_article_11() {
    sed -i '' 's/<div class="article-image-placeholder">.*<\/div>/<div class="article-image-placeholder">
            <img src="https:\/\/mmbiz.qpic.cn\/sz_mmbiz_png\/ib2p1poQ5qy2FjhUPBpUicOclOYwQ8Fk5ykPfH79GFmxDeJicxphUyWtpibeWRDJdbyU6ibHha8QNEiaXc9BUU0KtCAV0APO342pHnq3YleMHdnOw\/640?wx_fmt=png&from=appmsg&tp=webp&wxfrom=5&wx_lazy=1#imgIndex=0" alt="文章缩略图">
        <\/div>/' article-11.html
}

# 更新HTML部分 - article 12
update_article_12() {
    sed -i '' 's/<div class="article-image-placeholder">.*<\/div>/<div class="article-image-placeholder">
            <img src="https:\/\/mmbiz.qpic.cn\/sz_mmbiz_jpg\/HUQjRqLFFZsTK2J66oJBt3xMEsfN5HKuxh9va55icKFQfoGfiarb0c0edWiaEqJwib7YSmFO1O2icnk6XjnxwtcicswQ\/640?wx_fmt=jpeg&tp=webp&wxfrom=5&wx_lazy=1#imgIndex=0" alt="文章缩略图">
        <\/div>/' article-12.html
}

# 批量更新CSS
for i in {1..12}; do
    file="article-$i.html"
    if [ -f "$file" ]; then
        # 首先添加img样式
        if ! grep -q ".article-image-placeholder img" "$file"; then
            sed -i '' '
                /\.article-image-placeholder {/,/}/ {
                    /}/ a\
        .article-image-placeholder img {\
            width: 100%;\
            height: 100%;\
            object-fit: cover;\
        }\
        .article-image-placeholder {
                    /overflow: hidden;/! {
                        s/\.article-image-placeholder {/.article-image-placeholder {\
            overflow: hidden;/
                    }
                }
            ' "$file"
        fi
    fi
done

# 更新所有文章HTML
echo "更新article 1..."
update_article_1
echo "更新article 2..."
update_article_2
echo "更新article 3..."
update_article_3
echo "更新article 4..."
update_article_4
echo "更新article 5..."
update_article_5
echo "更新article 6..."
update_article_6
echo "更新article 7..."
update_article_7
echo "更新article 9..."
update_article_9
echo "更新article 10..."
update_article_10
echo "更新article 11..."
update_article_11
echo "更新article 12..."
update_article_12

echo "完成所有文章缩略图更新！"
