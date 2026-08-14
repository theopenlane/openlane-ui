import { common, createLowlight } from 'lowlight'
import basic from 'highlight.js/lib/languages/basic'
import bnf from 'highlight.js/lib/languages/bnf'
import clojure from 'highlight.js/lib/languages/clojure'
import coffeescript from 'highlight.js/lib/languages/coffeescript'
import coq from 'highlight.js/lib/languages/coq'
import dart from 'highlight.js/lib/languages/dart'
import delphi from 'highlight.js/lib/languages/delphi'
import dockerfile from 'highlight.js/lib/languages/dockerfile'
import ebnf from 'highlight.js/lib/languages/ebnf'
import elixir from 'highlight.js/lib/languages/elixir'
import elm from 'highlight.js/lib/languages/elm'
import erlang from 'highlight.js/lib/languages/erlang'
import fortran from 'highlight.js/lib/languages/fortran'
import fsharp from 'highlight.js/lib/languages/fsharp'
import gherkin from 'highlight.js/lib/languages/gherkin'
import glsl from 'highlight.js/lib/languages/glsl'
import groovy from 'highlight.js/lib/languages/groovy'
import haskell from 'highlight.js/lib/languages/haskell'
import julia from 'highlight.js/lib/languages/julia'
import latex from 'highlight.js/lib/languages/latex'
import lisp from 'highlight.js/lib/languages/lisp'
import livescript from 'highlight.js/lib/languages/livescript'
import llvm from 'highlight.js/lib/languages/llvm'
import mathematica from 'highlight.js/lib/languages/mathematica'
import matlab from 'highlight.js/lib/languages/matlab'
import nix from 'highlight.js/lib/languages/nix'
import ocaml from 'highlight.js/lib/languages/ocaml'
import powershell from 'highlight.js/lib/languages/powershell'
import prolog from 'highlight.js/lib/languages/prolog'
import protobuf from 'highlight.js/lib/languages/protobuf'
import reasonml from 'highlight.js/lib/languages/reasonml'
import scala from 'highlight.js/lib/languages/scala'
import scheme from 'highlight.js/lib/languages/scheme'
import smalltalk from 'highlight.js/lib/languages/smalltalk'
import verilog from 'highlight.js/lib/languages/verilog'
import vhdl from 'highlight.js/lib/languages/vhdl'
import x86asm from 'highlight.js/lib/languages/x86asm'

export const lowlight = createLowlight(common)

lowlight.register({
  basic,
  bnf,
  clojure,
  coffeescript,
  coq,
  dart,
  delphi,
  dockerfile,
  ebnf,
  elixir,
  elm,
  erlang,
  fortran,
  fsharp,
  gherkin,
  glsl,
  groovy,
  haskell,
  julia,
  latex,
  lisp,
  livescript,
  llvm,
  mathematica,
  matlab,
  nix,
  ocaml,
  powershell,
  prolog,
  protobuf,
  reasonml,
  scala,
  scheme,
  smalltalk,
  verilog,
  vhdl,
  x86asm,
})

export const isRegisteredLanguage = (language: string) => language === 'auto' || language === 'plaintext' || lowlight.registered(language)
