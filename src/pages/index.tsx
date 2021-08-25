import { useState } from 'react';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { FaUser, FaCalendar } from 'react-icons/fa';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function fetchData(link: string) {
    await fetch(link)
      .then(response => response.json())
      .then(data => {
        const formatedDatePosts = data.results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: new Date(
              post.first_publication_date
            ).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            }),
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          };
        });

        const updatedPosts = [...posts, ...formatedDatePosts];
        setPosts(updatedPosts);
        setNextPage(data.next_page);
      });
  }

  return (
    <div className={commonStyles.container}>
      <nav className={styles.nav}>
        <img src="/images/logo.svg" alt="logo" />
      </nav>
      <main className={styles.posts}>
        <div>
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div className={styles.info}>
                  <div>
                    <FaCalendar />
                    <time>{post.first_publication_date}</time>
                  </div>
                  <div>
                    <FaUser />
                    <p>{post.data.author}</p>
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </div>
        {nextPage && (
          <button type="button" onClick={() => fetchData(nextPage)}>
            Carregar mais posts
          </button>
        )}
      </main>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 20,
    }
  );

  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: new Date(
        post.first_publication_date
      ).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const nextPage = postsResponse.next_page;

  return {
    props: {
      postsPagination: {
        next_page: nextPage,
        results,
      },
    },
  };
};
