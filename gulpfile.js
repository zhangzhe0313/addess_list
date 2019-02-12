var gulp = require('gulp');
var livereload = require('gulp-livereload'), // 网页自动刷新（文件变动后即时刷新页面）
	webserver = require('gulp-webserver'), // 本地服务器
	uglify = require('gulp-uglify'),
	pump = require('pump'),
	runSequence = require('run-sequence'),
	browserSync = require('browser-sync').create(),
	rename = require('gulp-rename'),
	minifyCSS = require('gulp-clean-css');

// js第三方未压缩插件压缩处理(*.min.js文件除外)
gulp.task('prod3thcomcopy', function (cp) {
	var stream = gulp.src(['./addressPlugin.js'])
		.pipe(uglify({
			compress: true
		}))
		.pipe(rename({suffix:'.min'}))
		.pipe(gulp.dest('./dist/'))

	console.log('生产环境 css md5处理完毕');
	return stream;
})

gulp.task('css-min', function () {
	var stream = gulp.src(['./*.css'])
		.pipe(minifyCSS({
			compatibility: 'ie8',
			keepSpecialComments: '*'
		}))
		.pipe(rename({suffix:'.min'}))
		.pipe(gulp.dest('./dist/'))

	console.log('生产环境 css md5处理完毕');
	return stream;
});

//image文件
gulp.task('copy-image',function(){
	gulp.src('./*.png')
			.pipe(gulp.dest('./dist/'));
});


// 生产环境 一键处理
gulp.task('prod', function (callback) {
	runSequence('prod3thcomcopy', 'css-min', 'copy-image')
});