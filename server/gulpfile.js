"use strict";

// Import required libraries(modules)
let gulp = require("gulp");
let merge = require("merge2");
let sourcemaps = require('gulp-sourcemaps');
let ts = require("gulp-typescript");
let tslint = require("gulp-tslint");

let tsProject = ts.createProject("tsconfig.json", {noImplicitAny: true});

gulp.task("default", function () {
  let tsResult = tsProject.src()
      .pipe(sourcemaps.init())
      .pipe(tsProject())
      .once("error", function () {
        this.once("finish", function () {
          process.exit(1);
        });
      });

  return merge([
    tsResult.dts.pipe(gulp.dest('build')),
    tsResult.js.pipe(sourcemaps.write('build')).pipe(gulp.dest('build'))
  ]);
});

// gulp.task("ts", function () {
//   let tsResult = tsProject.src()
//       .pipe(sourcemaps.init())
//       .pipe(tsProject())
//       .once("error", function () {
//         this.once("finish", function () {
//           process.exit(1);
//         });
//       });

//   return merge([
//     tsResult.dts.pipe(gulp.dest('.')),
//     tsResult.js.pipe(sourcemaps.write('.')).pipe(gulp.dest('.'))
//   ]);
// });

// gulp.task("tslint", function () {
//   return tsProject.src()
//       .pipe(tslint({
//         formatter: "prose"
//       }))
//       .pipe(tslint({
//         configuration: "tslint.json"
//       }))
//       .pipe(tslint.report({
//         emitError: true,
//         reportLimit: 0,
//         summarizeFailureOutput: false,
//         allowWarnings: true
//       }))
//       .once("error", function () {
//         this.once("finish", function () {
//           process.exit(1)
//         });
//       });
// });
