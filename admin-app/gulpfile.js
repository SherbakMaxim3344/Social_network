import gulp from 'gulp';
import less from 'gulp-less';
import cleanCSS from 'gulp-clean-css';
import rename from 'gulp-rename';
import uglify from 'gulp-uglify';
import babel from 'gulp-babel';
import { deleteAsync } from 'del';

// Очистка папки dist-gulp
export const clean = () => deleteAsync(['dist-gulp']);

// Компиляция LESS в CSS с минификацией
export const styles = () => {
    return gulp.src('src/less/**/*.less')
        .pipe(less())
        .pipe(cleanCSS())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('dist-gulp/css'));
};

// Компиляция JavaScript с Babel и минификацией
export const scripts = () => {
    return gulp.src('src/js/**/*.js')
        .pipe(babel({
            presets: ['@babel/preset-env']
        }))
        .pipe(uglify())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('dist-gulp/js'));
};

// Основная сборка Gulp
export const build = gulp.series(
    clean,
    gulp.parallel(styles, scripts)
);

export default build;