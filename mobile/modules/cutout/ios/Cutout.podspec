Pod::Spec.new do |s|
  s.name           = 'Cutout'
  s.version        = '1.0.0'
  s.summary        = 'Cuts pieces of clothing out of photos on the device with Apple Vision'
  s.description    = 'Rotation’s local Expo module: subject lifting (VNGenerateForegroundInstanceMaskRequest) for photos added on the phone.'
  s.author         = 'dango-design'
  s.homepage       = 'https://github.com/dango-design/rotation'
  s.platforms      = {
    :ios => '16.4'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'Vision', 'CoreImage', 'ImageIO', 'UniformTypeIdentifiers'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
