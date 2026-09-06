# TipTop Android

WebView vers l’instance Render : `https://tiptop-cesar99.onrender.com`

```bash
# local
echo "sdk.dir=$ANDROID_HOME" > local.properties
./gradlew assembleDebug
# APK : app/build/outputs/apk/debug/app-debug.apk
```

Changer l’URL dans `app/src/main/res/values/strings.xml` (`app_url`) si le service Render a un autre nom.
