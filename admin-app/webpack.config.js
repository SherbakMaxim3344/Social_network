import path from 'path';
import { fileURLToPath } from 'url';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'production',
  entry: {
    main: './src/js/main.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist-webpack'),
    filename: 'js/[name].min.js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.less$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: false,
            }
          },
          {
            loader: 'less-loader',
            options: {
              sourceMap: false,
              lessOptions: {
                strictMath: true,
                paths: [path.resolve(__dirname, 'src/less')]
              }
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ]
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/main.min.css'
    })
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin(),
      new CssMinimizerPlugin(),
    ],
  },
  resolve: {
    extensions: ['.js', '.less', '.css']
  }
};