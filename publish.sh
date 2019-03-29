#!/usr/bin/env bash
#npm install --save-dev @babel/core
#npm install --save-dev @babel/preset-env
#for folders in $(find /var/www/projects/fa-nodejs/* -type d )
#do echo "$folders"
#done
## CLEAN GIT CACHE
for git_cache in $(git ls-files -i --exclude-standard)
do echo "$git_cache" && git rm -f --cached "$git_cache"
done
## PUBLISH TO NPM
PREV=`git describe --abbrev=0 --tags`
TAG=(${PREV//./ })
TAG1=${TAG[0]}
TAG2=${TAG[1]}
TAG3=${TAG[2]}
TAG3=$((TAG3+1))
NEXT="$TAG1.$TAG2.$TAG3"
COMMIT=`git rev-parse HEAD`
MESSAGE=`git log -1 --oneline` #MESSAGE=`git log -1`
PUBLISHED=`git describe --contains ${COMMIT}`
if [[ -z "$PUBLISHED" ]]; then
    echo "updating to tag <$NEXT>"
    git add -A
    git commit -a -m "update to tag <$NEXT> $COMMIT: $MESSAGE"
    npm version ${NEXT} #npm version patch
    git push
    git tag ${NEXT}
    git push --tags
    npm publish
else
    echo "already have tag <$PREV> on commit $COMMIT: $MESSAGE"
fi
