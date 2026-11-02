assets/
  hero.jpg, og.jpg    captures of the live 3D view (re-render with blender/hero_render.py for a higher quality still)
  tex/                PBR textures, one quality for every device: <name>_albedo.webp + <name>_normal.webp
                      (close-up surfaces 1024 px, large background surfaces 512 px, ~2 MB).
                      Regenerate: python3 tools/make_textures.py && python3 tools/make_standard.py
  lightmaps/          baked soft shadows + cabin light pools (manifest.json + webp), made by blender/bake_lightmaps.py
