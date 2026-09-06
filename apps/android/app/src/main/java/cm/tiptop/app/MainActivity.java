package cm.tiptop.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class MainActivity extends AppCompatActivity {
  private static final int REQ = 42;
  private WebView webView;
  private PermissionRequest pendingWeb;
  private GeolocationPermissions.Callback pendingGeo;
  private String pendingGeoOrigin;

  @Override
  @SuppressLint("SetJavaScriptEnabled")
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    webView = new WebView(this);
    setContentView(webView);

    WebSettings settings = webView.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setDatabaseEnabled(true);
    settings.setMediaPlaybackRequiresUserGesture(false);
    settings.setGeolocationEnabled(true);
    settings.setAllowFileAccess(true);
    settings.setCacheMode(WebSettings.LOAD_DEFAULT);
    settings.setUserAgentString(settings.getUserAgentString() + " TipTopApp/1.0");

    webView.setWebViewClient(new WebViewClient());
    webView.setWebChromeClient(
        new WebChromeClient() {
          @Override
          public void onPermissionRequest(PermissionRequest request) {
            pendingWeb = request;
            requestNativePermissions();
          }

          @Override
          public void onGeolocationPermissionsShowPrompt(
              String origin, GeolocationPermissions.Callback callback) {
            pendingGeoOrigin = origin;
            pendingGeo = callback;
            requestNativePermissions();
          }
        });

    webView.loadUrl(getString(R.string.app_url));
  }

  private void requestNativePermissions() {
    String[] needed = {
      Manifest.permission.CAMERA,
      Manifest.permission.RECORD_AUDIO,
      Manifest.permission.ACCESS_FINE_LOCATION,
      Manifest.permission.ACCESS_COARSE_LOCATION
    };
    java.util.ArrayList<String> missing = new java.util.ArrayList<>();
    for (String p : needed) {
      if (ContextCompat.checkSelfPermission(this, p) != PackageManager.PERMISSION_GRANTED) {
        missing.add(p);
      }
    }
    if (missing.isEmpty()) {
      grantPending();
      return;
    }
    ActivityCompat.requestPermissions(this, missing.toArray(new String[0]), REQ);
  }

  private void grantPending() {
    if (pendingWeb != null) {
      pendingWeb.grant(pendingWeb.getResources());
      pendingWeb = null;
    }
    if (pendingGeo != null) {
      pendingGeo.invoke(pendingGeoOrigin, true, false);
      pendingGeo = null;
    }
  }

  @Override
  public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    grantPending();
  }

  @Override
  public void onBackPressed() {
    if (webView != null && webView.canGoBack()) {
      webView.goBack();
      return;
    }
    super.onBackPressed();
  }
}
