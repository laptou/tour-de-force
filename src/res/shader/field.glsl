
varying vec2 vTextureCoord;
uniform vec4 filterArea;
uniform sampler2D uSampler;
uniform float delta;

void main(void)
{
    vec4 color = texture2D(uSampler, vTextureCoord);
    color += texture2D(uSampler, vTextureCoord + vec2(1.0, 0.0) / filterArea.xy);
    color += texture2D(uSampler, vTextureCoord + vec2(-1.0, 0.0) / filterArea.xy);
    color += texture2D(uSampler, vTextureCoord + vec2(0.0,  1.0) / filterArea.xy);
    color += texture2D(uSampler, vTextureCoord + vec2(0.0, -1.0) / filterArea.xy);

    gl_FragColor = color * 0.2;
}