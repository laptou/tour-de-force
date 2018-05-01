precision mediump float;

uniform sampler2D uMainSampler;
uniform vec4 uIntensity;

varying vec2 outTexCoord;

void main() 
{
    vec4 texel = texture2D(uMainSampler, outTexCoord);
    float lightness = max(uIntensity.a, max(texel.r, max(texel.g, texel.b)));
    gl_FragColor = min(texel + uIntensity * lightness, vec4(1.0));
}
