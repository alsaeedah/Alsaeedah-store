# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.

# Capacitor and Cordova keep rules
-keep class com.getcapacitor.** { *; }
-keep class org.apache.cordova.** { *; }
-keep class com.alsaeedah.dashboard.** { *; }

# Keep WebView and JavaScript interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Preserve line number information for debugging stack traces
-keepattributes SourceFile,LineNumberTable

# Standard rules for WebViews
-keepclassmembers class * extends android.webkit.WebChromeClient {
    public void openFileChooser(...);
}

# General Retrofit / Gson rules (in case native plugins use them)
-keep class retrofit2.** { *; }
-keep class com.google.gson.** { *; }
-keepattributes Signature
-keepattributes *Annotation*
-keep class sun.misc.Unsafe { *; }
