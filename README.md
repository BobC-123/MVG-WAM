# MVG-WAM

**Multiple View Geometry-Aware World-Action Modeling for Robotic Manipulation**

[Project Website](https://bobc-123.github.io/MVG-WAM/) · [arXiv](https://arxiv.org/abs/2609.37793) · [Paper PDF](https://arxiv.org/pdf/2609.37793) · [Demos](https://bobc-123.github.io/MVG-WAM/#demos)

**Wenbo Chen<sup>1,*</sup>, Tianfu Li<sup>1,*</sup>, Haoxuan Xu<sup>2,*</sup>, Zhihao Cao<sup>3</sup>, Zhenghan Chen<sup>4</sup>, Zhengming Zhu<sup>5</sup>, Zizhou Luo<sup>6</sup>, Guosheng Yang<sup>1</sup>, Yuan Liu<sup>2</sup>, Lujia Wang<sup>1</sup>, Wen Chen<sup>1</sup>, Haoang Li<sup>1</sup>**

<sup>1</sup> The Hong Kong University of Science and Technology (Guangzhou)<br>
<sup>2</sup> The Hong Kong University of Science and Technology<br>
<sup>3</sup> ETH Zurich · <sup>4</sup> Zhejiang University · <sup>5</sup> EPFL · <sup>6</sup> University of Zurich

<sup>*</sup> Wenbo Chen, Tianfu Li, and Haoxuan Xu contributed equally to this work.

## Code release

**Code coming soon.** We are preparing the official implementation of MVG-WAM for release. The code will be released in this repository.

For now, this repository hosts the project website and demonstration assets. The model implementation is not yet available.

## Overview

MVG-WAM treats synchronized camera observations as geometrically related projections of one physical world. It combines an epipolar-constrained global state, view-indexed geometric conditioning, and training-time future metric-depth supervision for robotic manipulation.

| Evaluation | Average success rate |
| --- | ---: |
| LIBERO | 99.1% |
| RoboTwin 2.0 | 92.07% |
| Real-world Cobot Magic | 91.3% (137/150 trials) |

See the [project website](https://bobc-123.github.io/MVG-WAM/) for multi-view demonstrations, method details, and evaluation protocols.

## Citation

If you find our work useful, please cite:

```bibtex
@misc{chen2026mvgwammultipleviewgeometryaware,
  title = {MVG-WAM: Multiple View Geometry-Aware
           World-Action Modeling for Robotic Manipulation},
  author = {Wenbo Chen and Tianfu Li and Haoxuan Xu
            and Zhihao Cao and Zhenghan Chen and Zhengming Zhu
            and Zizhou Luo and Guosheng Yang and Yuan Liu
            and Lujia Wang and Wen Chen and Haoang Li},
  year = {2026},
  eprint = {2609.37793},
  archivePrefix = {arXiv},
  primaryClass = {cs.RO},
  url = {https://arxiv.org/abs/2609.37793}
}
```
