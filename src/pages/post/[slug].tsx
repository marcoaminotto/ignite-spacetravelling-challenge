import { useEffect, useMemo } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { FaCalendar, FaUser, FaClock } from 'react-icons/fa';

import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  useEffect(() => {
    const script = document.createElement('script');
    const anchor = document.getElementById('inject-comments-for-uterances');
    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('async', 'true');
    script.setAttribute(
      'repo',
      'marcoaminotto/ignite-spacetravelling-challenge'
    );
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('theme', 'photon-dark');
    anchor.appendChild(script);
  }, []);

  const publicationDate = useMemo(() => {
    return String(
      new Date(post.first_publication_date)
        .toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
        .replace(/( de)|\./g, '')
    );
  }, [post]);

  const readTime = useMemo(() => {
    if (router.isFallback) {
      return 1;
    }
    const wordsPerMinute = 170;

    const fullTextLength = post.data.content.map(content => {
      return (
        RichText.asText(content.body).split(/\s/g).length +
        content.heading.split(/\s/g).length
      );
    });

    const amountOfWords = fullTextLength.reduce(
      (accumulator, currentValue) => accumulator + currentValue
    );

    const time = Math.round(amountOfWords / wordsPerMinute);

    return time === 0 ? 1 : time;
  }, [post, router.isFallback]);

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Head>
        <title>{post.data.title} | SpaceTraveling</title>
      </Head>

      <Header />
      <main className={styles.container}>
        <header>
          <img src={post.data.banner.url} alt={post.data.title} />
        </header>
        <article className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={styles.info}>
            <time>
              <FaCalendar />
              {publicationDate}
            </time>
            <span>
              <FaUser />
              {post.data.author}
            </span>
            <span>
              <FaClock />
              {readTime} min
            </span>
          </div>
          <div />
          <div className={styles.content}>
            {post.data.content.map(postContent => {
              return (
                <div key={postContent.heading}>
                  <h2>{postContent.heading}</h2>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(postContent.body),
                    }}
                  />
                </div>
              );
            })}
          </div>
        </article>
      </main>
      <div id="inject-comments-for-uterances" />
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 20,
    }
  );

  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  return {
    props: {
      post: response,
    },
    revalidate: 60 * 60,
  };
};
